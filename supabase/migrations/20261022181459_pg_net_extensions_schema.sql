-- Move pg_net out of the public schema (Supabase security advisor). pg_net cannot be moved in place,
-- so it is dropped and recreated; its functions stay in the "net" schema either way.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
