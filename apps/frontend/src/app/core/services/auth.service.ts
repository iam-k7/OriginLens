import { Injectable, signal, computed } from '@angular/core';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

import { supabase } from '../supabase.client';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  plan: 'free' | 'pro';
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Auth state, backed by the live Supabase session.
 *
 * - On construction, calls `supabase.auth.getSession()` to read any existing
 *   session from storage and sets the `user` signal accordingly.
 * - Subscribes to `supabase.auth.onAuthStateChange` so sign-in / sign-out
 *   events from any code path update the signal in real time.
 * - Exposes a `session` signal with the raw Supabase session, and a
 *   `isAuthenticated` computed.
 *
 * The legacy `login()` / `signup()` methods were removed — the auth pages
 * call `supabase.auth.*` directly. This service is now the read-only
 * source of truth for "is the user signed in?" in the Angular UI.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<Session | null>(null);
  private readonly _supabaseUser = signal<SupabaseUser | null>(null);

  readonly session = this._session.asReadonly();
  readonly supabaseUser = this._supabaseUser.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  /** Convenience projection: a `User` matching the legacy shape. */
  readonly user = computed<User | null>(() => {
    const su = this._supabaseUser();
    if (!su) return null;
    return {
      id: su.id,
      email: su.email ?? '',
      displayName:
        (su.user_metadata?.['display_name'] as string | undefined) ??
        su.email?.split('@')[0],
      plan: 'free',
    };
  });

  /** Raw access token (read from the session). */
  readonly accessToken = computed<string | null>(() => this._session()?.access_token ?? null);

  constructor() {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // No session is fine; surface only real errors.
      console.warn('[AuthService] getSession error:', error.message);
    }
    this._session.set(data.session);
    this._supabaseUser.set(data.session?.user ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      this._supabaseUser.set(session?.user ?? null);
    });
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    // onAuthStateChange will clear the signals; no manual reset needed.
  }
}
