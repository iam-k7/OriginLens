import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ol-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="ol-footer">
      <div class="ol-container ol-footer__inner">
        <div class="ol-footer__brand">
          <span class="ol-footer__mark" aria-hidden="true">◎</span>
          <div>
            <strong>OriginLens</strong>
            <p>Understand where your content comes from.</p>
          </div>
        </div>

        <nav class="ol-footer__links" aria-label="Footer navigation">
          <a routerLink="/analyzer">Analyzer</a>
          <a routerLink="/text">Text Intelligence</a>
          <a routerLink="/pricing">Pricing</a>
          <a routerLink="/login">Log in</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
      .ol-footer {
        border-top: 1px solid var(--ol-color-border);
        background: rgba(255, 255, 255, 0.9);
        padding: var(--ol-sp-8) 0 var(--ol-sp-10);
        margin-top: var(--ol-sp-16);
      }

      .ol-footer__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--ol-sp-6);
      }

      .ol-footer__brand {
        display: inline-flex;
        align-items: center;
        gap: var(--ol-sp-3);
      }

      .ol-footer__mark {
        display: inline-grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary);
        font-size: 0.9rem;
      }

      .ol-footer__brand strong {
        display: block;
        color: var(--ol-color-fg);
        font-size: var(--ol-fs-md);
      }

      .ol-footer__brand p {
        margin: 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }

      .ol-footer__links {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ol-sp-5);
      }

      .ol-footer__links a {
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-medium);
      }
    `,
  ],
})
export class FooterComponent {}
