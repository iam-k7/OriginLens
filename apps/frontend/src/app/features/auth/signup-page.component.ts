import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthError } from '../../core/services/auth.service';
import { supabase } from '../../core/supabase.client';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'ol-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss',
})
export class SignupPageComponent {
  email = '';
  displayName = '';
  password = '';
  confirmPassword = '';
  agreed = false;
  readonly submitting = signal(false);
  readonly error = signal<AuthError | null>(null);
  readonly notice = signal<string | null>(null);

  constructor(private router: Router) {}

  passwordStrength(): 'weak' | 'ok' | 'strong' {
    const p = this.password;
    if (p.length < 8) return 'weak';
    if (p.length >= 12 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)) return 'strong';
    return 'ok';
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;

    if (this.password !== this.confirmPassword) {
      this.error.set({ code: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' });
      return;
    }
    if (!this.agreed) {
      this.error.set({ code: 'TERMS_REQUIRED', message: 'You must agree to the terms to continue.' });
      return;
    }

    this.error.set(null);
    this.notice.set(null);
    this.submitting.set(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: this.email.trim(),
        password: this.password,
        options: this.displayName.trim()
          ? { data: { display_name: this.displayName.trim() } }
          : undefined,
      });
      if (error) {
        this.error.set({ code: 'SIGNUP_FAILED', message: error.message });
        return;
      }
      if (!data.session) {
        this.notice.set('Check your email and confirm your account before logging in.');
        return;
      }
      await this.router.navigate(['']);
    } catch (e) {
      const err = e as { message?: string };
      this.error.set({ code: 'SIGNUP_FAILED', message: err.message ?? 'Sign up failed.' });
    } finally {
      this.submitting.set(false);
    }
  }
}
