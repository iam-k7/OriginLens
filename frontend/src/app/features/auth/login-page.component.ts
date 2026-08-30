import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthError } from '../../core/services/auth.service';
import { getSupabaseClient } from '../../core/supabase.client';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'ol-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly error = signal<AuthError | null>(null);
  readonly showPassword = signal(false);

  constructor(private router: Router) {}

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.error.set(null);
    this.submitting.set(true);
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: this.email.trim(),
        password: this.password,
      });
      if (error) {
        this.error.set({ code: 'LOGIN_FAILED', message: error.message });
        return;
      }
      if (!data.session) {
        this.error.set({ code: 'NO_SESSION', message: 'No active session. Please try logging in again.' });
        return;
      }
      await this.router.navigate(['']);
    } catch (e) {
      const err = e as { message?: string };
      this.error.set({ code: 'LOGIN_FAILED', message: err.message ?? 'Login failed.' });
    } finally {
      this.submitting.set(false);
    }
  }
}
