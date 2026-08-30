import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'ol-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="ol-nav">
      <div class="ol-container ol-nav__inner">
        <a routerLink="/" class="ol-nav__brand" aria-label="OriginLens home">
          <span class="ol-nav__brand-mark" aria-hidden="true">◎</span>
          <span class="ol-nav__brand-text">OriginLens</span>
        </a>

        <nav class="ol-nav__links" aria-label="Primary navigation">
          <a routerLink="/analyzer" routerLinkActive="is-active">Analyzer</a>
          <a routerLink="/text" routerLinkActive="is-active">Text Intelligence</a>
          <a routerLink="/pricing" routerLinkActive="is-active">Pricing</a>
        </nav>

        <div class="ol-nav__actions">
          @if (auth.isAuthenticated()) {
            <div class="ol-nav__auth ol-nav__auth--user">
              <span class="ol-nav__email" title="{{ auth.user()?.email }}">
                {{ auth.user()?.displayName || auth.user()?.email }}
              </span>
              <button type="button" class="ol-nav__logout" (click)="logout()">
                Log out
              </button>
            </div>
          } @else {
            <div class="ol-nav__auth">
              <a routerLink="/login" class="ol-nav__login">Log in</a>
              <a routerLink="/signup" class="ol-nav__cta">Sign up</a>
            </div>
          }
        </div>

        <button
          type="button"
          class="ol-nav__menu-toggle"
          aria-label="Toggle navigation menu"
          [attr.aria-expanded]="mobileMenuOpen()"
          (click)="toggleMenu()"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      @if (mobileMenuOpen()) {
        <div class="ol-nav__mobile" role="dialog" aria-label="Mobile navigation">
          <nav class="ol-nav__mobile-links" aria-label="Secondary navigation">
            <a routerLink="/analyzer" routerLinkActive="is-active" (click)="closeMenu()">Analyzer</a>
            <a routerLink="/text" routerLinkActive="is-active" (click)="closeMenu()">Text Intelligence</a>
            <a routerLink="/pricing" routerLinkActive="is-active" (click)="closeMenu()">Pricing</a>
            @if (auth.isAuthenticated()) {
              <button type="button" class="ol-nav__mobile-logout" (click)="logout()">Log out</button>
            } @else {
              <a routerLink="/login" class="ol-nav__mobile-login" (click)="closeMenu()">Log in</a>
              <a routerLink="/signup" class="ol-nav__mobile-cta" (click)="closeMenu()">Sign up</a>
            }
          </nav>
        </div>
      }
    </header>
  `,
  styles: [
    `
      .ol-nav {
        position: sticky;
        top: 0;
        z-index: var(--ol-z-nav);
        background: rgba(255, 250, 246, 0.9);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(234, 178, 138, 0.5);
        box-shadow: 0 6px 18px rgba(23, 18, 14, 0.02);
      }

      .ol-nav__inner {
        display: flex;
        align-items: center;
        gap: var(--ol-sp-6);
        width: 100%;
        min-height: var(--ol-nav-height);
      }

      .ol-nav__brand {
        display: inline-flex;
        align-items: center;
        gap: var(--ol-sp-2);
        color: var(--ol-color-fg);
        font-weight: var(--ol-fw-bold);
        font-size: var(--ol-fs-lg);
      }

      .ol-nav__brand-mark {
        display: inline-grid;
        place-items: center;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 50%;
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary);
        font-size: 0.95rem;
        box-shadow: inset 0 0 0 1px rgba(255, 122, 26, 0.12);
      }

      .ol-nav__links {
        display: flex;
        align-items: center;
        gap: var(--ol-sp-5);
        margin-left: auto;
      }

      .ol-nav__links a {
        position: relative;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-medium);
        padding: var(--ol-sp-2) 0;
      }

      .ol-nav__links a.is-active,
      .ol-nav__links a:hover {
        color: var(--ol-color-fg);
      }

      .ol-nav__links a.is-active::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -0.6rem;
        height: 2px;
        border-radius: 999px;
        background: var(--ol-color-primary);
      }

      .ol-nav__actions {
        display: flex;
        align-items: center;
      }

      .ol-nav__auth {
        display: flex;
        align-items: center;
        gap: var(--ol-sp-3);
      }

      .ol-nav__auth--user {
        gap: var(--ol-sp-4);
      }

      .ol-nav__login {
        color: var(--ol-color-fg);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-medium);
      }

      .ol-nav__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--ol-color-primary);
        color: var(--ol-color-on-primary);
        padding: 0.7rem 1rem;
        border-radius: var(--ol-radius-md);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-semibold);
        box-shadow: var(--ol-shadow-sm);
      }

      .ol-nav__cta:hover {
        background: var(--ol-color-primary-hover);
        color: var(--ol-color-on-primary);
      }

      .ol-nav__email {
        color: var(--ol-color-fg);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-medium);
        max-width: 18ch;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ol-nav__logout,
      .ol-nav__mobile-logout {
        background: transparent;
        color: var(--ol-color-fg);
        border: 1px solid var(--ol-color-border-strong);
        padding: 0.7rem 0.9rem;
        border-radius: var(--ol-radius-md);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-semibold);
      }

      .ol-nav__logout:hover,
      .ol-nav__mobile-logout:hover {
        background: var(--ol-color-bg-muted);
      }

      .ol-nav__menu-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 0.28rem;
        width: 2.7rem;
        height: 2.7rem;
        border: 1px solid var(--ol-color-border);
        border-radius: 0.7rem;
        background: rgba(255, 255, 255, 0.6);
      }

      .ol-nav__menu-toggle span {
        display: block;
        width: 1.1rem;
        height: 2px;
        background: var(--ol-color-fg);
        border-radius: 999px;
      }

      .ol-nav__mobile {
        padding: 0 1rem 1rem;
      }

      .ol-nav__mobile-links {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid var(--ol-color-border);
        border-radius: var(--ol-radius-lg);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: var(--ol-shadow-sm);
      }

      .ol-nav__mobile-links a,
      .ol-nav__mobile-links button {
        width: 100%;
        text-align: left;
        border: none;
        background: transparent;
        padding: 0.75rem 0.8rem;
        border-radius: var(--ol-radius-md);
        color: var(--ol-color-fg);
        font-weight: var(--ol-fw-medium);
      }

      .ol-nav__mobile-links a.is-active {
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary-deep);
      }

      .ol-nav__mobile-login,
      .ol-nav__mobile-cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .ol-nav__mobile-cta {
        background: var(--ol-color-primary);
        color: var(--ol-color-on-primary);
      }

      @media (max-width: 640px) {
        .ol-nav__links,
        .ol-nav__actions {
          display: none;
        }

        .ol-nav__menu-toggle {
          display: inline-flex;
          margin-left: auto;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  toggleMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
