-- Fix: the profile upsert fired the BEFORE INSERT trigger even when the row already existed, sending repeat emails.
-- AFTER triggers fire only for the insert or update that really happened, and claiming welcomed_at first makes it send once.
drop trigger send_welcome_email on public.profiles;

create or replace function public.send_welcome_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  api_key text;
  provider text;
  safe_name text;
begin
  if new.welcomed_at is not null or new.email is null then
    return null;
  end if;
  select raw_app_meta_data ->> 'provider' into provider from auth.users where id = new.id;
  if new.country is null and coalesce(provider, 'email') = 'email' then
    return null; -- email sign-up not finished yet
  end if;

  select decrypted_secret into api_key from vault.decrypted_secrets where name = 'resend_api_key';
  if api_key is null then
    raise warning 'resend_api_key is missing from Vault; welcome email not sent';
    return null;
  end if;

  -- Claim the send; a concurrent or repeated update finds welcomed_at already set and stops here.
  update public.profiles set welcomed_at = now() where id = new.id and welcomed_at is null;
  if not found then
    return null;
  end if;

  -- The name is user input, so it is escaped before going into HTML.
  safe_name := replace(replace(replace(replace(coalesce(nullif(trim(new.full_name), ''), 'there'),
    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'OriginLens <no-reply@originlens.bond>',
      'to', jsonb_build_array(new.email),
      'subject', 'Welcome to OriginLens',
      'html',
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#16120F">'
        || '<h1 style="font-size:24px">Welcome to OriginLens, ' || safe_name || '!</h1>'
        || '<p>Your account is ready. OriginLens helps you understand where images and text come from.</p>'
        || '<ul><li>Check images for Content Credentials and AI labels</li>'
        || '<li>View and remove hidden photo metadata, like GPS location</li>'
        || '<li>Get clear, sentence-by-sentence feedback on your writing</li></ul>'
        || '<p>Images are checked in your browser and never stored.</p>'
        || '<p><a href="https://www.originlens.bond/analyzer" style="display:inline-block;background:#FF6A00;color:#16120F;'
        || 'padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Start analysing</a></p>'
        || '<p style="font-size:12px;color:#6b625b">You received this email because you created an OriginLens account.</p>'
        || '</div>',
      'text',
        'Welcome to OriginLens, ' || coalesce(nullif(trim(new.full_name), ''), 'there') || '!' || chr(10) || chr(10)
        || 'Your account is ready. Start analysing: https://www.originlens.bond/analyzer'
    )
  );
  return null;
end;
$$;

revoke execute on function public.send_welcome_email() from public, anon, authenticated;

create trigger send_welcome_email after insert or update of country on public.profiles
  for each row execute function public.send_welcome_email();
