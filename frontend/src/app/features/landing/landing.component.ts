import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ol-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="ol-container ol-hero">
      <div class="ol-hero__content">
        <div class="ol-hero__copy">
          <span class="ol-eyebrow">Content provenance, made clear</span>
          <h1>Verify where your content came from before you trust it.</h1>
          <p class="ol-hero__lede">
            OriginLens analyzes images and text for metadata, provenance signals,
            and AI-generation indicators — with a privacy-first workflow built for
            faster decisions and safer sharing.
          </p>

          <div class="ol-hero__cta">
            <a routerLink="/analyzer" class="ol-btn ol-btn--primary">Open Analyzer</a>
            <a routerLink="/text" class="ol-btn ol-btn--ghost">Try Text Intelligence</a>
          </div>

          <div class="ol-hero__trust">
            <span>Privacy-first</span>
            <span>Temporary processing</span>
            <span>No permanent storage</span>
          </div>
        </div>

        <div class="ol-hero__visual" aria-label="OriginLens product preview">
          <div class="ol-preview-card">
            <div class="ol-preview-card__header">
              <span class="ol-preview-card__dot ol-preview-card__dot--orange"></span>
              <span class="ol-preview-card__dot"></span>
              <span class="ol-preview-card__dot"></span>
            </div>

            <div class="ol-preview-card__body">
              <div class="ol-score-ring">
                <div class="ol-score-ring__value">72%</div>
              </div>

              <div class="ol-preview-card__meta">
                <div>
                  <label>AI signal</label>
                  <strong>Moderate</strong>
                </div>
                <div>
                  <label>Source</label>
                  <strong>Metadata + C2PA</strong>
                </div>
              </div>
            </div>

            <div class="ol-preview-card__tags">
              <span>Origin check</span>
              <span>Image analysis</span>
              <span>Provenance</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ol-container ol-section ol-metrics">
      <div class="ol-metrics__grid">
        <article>
          <strong>4.9/5</strong>
          <span>workflow clarity</span>
        </article>
        <article>
          <strong>12k+</strong>
          <span>content checks reviewed</span>
        </article>
        <article>
          <strong>0 uploads</strong>
          <span>stored permanently</span>
        </article>
        <article>
          <strong>2 min</strong>
          <span>to understand the source</span>
        </article>
      </div>
    </section>

    <section class="ol-container ol-section ol-features">
      <div class="ol-section__heading">
        <span class="ol-eyebrow">Why teams choose OriginLens</span>
        <h2>Insights that help you act with confidence.</h2>
      </div>

      <div class="ol-card-grid">
        <article class="ol-feature-card">
          <span class="ol-feature-card__icon">◎</span>
          <h3>Provenance review</h3>
          <p>See metadata, device traces, and authenticity signals in one structured view.</p>
        </article>
        <article class="ol-feature-card">
          <span class="ol-feature-card__icon">✦</span>
          <h3>AI signal analysis</h3>
          <p>Interpret confidence, detected patterns, and limitations without false certainty.</p>
        </article>
        <article class="ol-feature-card">
          <span class="ol-feature-card__icon">▣</span>
          <h3>Text intelligence</h3>
          <p>Check tone, rewrite quality, and relevant signals for written content in context.</p>
        </article>
      </div>
    </section>

    <section class="ol-container ol-section ol-steps">
      <div class="ol-section__heading">
        <span class="ol-eyebrow">How it works</span>
        <h2>Fast analysis, clear evidence, better decisions.</h2>
      </div>

      <div class="ol-step-grid">
        <article>
          <span>01</span>
          <h3>Upload or paste</h3>
          <p>Drop a file or submit a URL to start the review in seconds.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Inspect the signals</h3>
          <p>Review metadata, AI indicators, source clues, and technical context.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Act with context</h3>
          <p>Share, sanitize, or escalate with a confident evidence trail.</p>
        </article>
      </div>
    </section>

    <section class="ol-container ol-section ol-final-cta">
      <div class="ol-final-cta__panel">
        <div>
          <span class="ol-eyebrow">Built for trust</span>
          <h2>Check content provenance before you publish or share.</h2>
        </div>
        <div class="ol-final-cta__actions">
          <a routerLink="/signup" class="ol-btn ol-btn--primary">Start free</a>
          <a routerLink="/pricing" class="ol-btn ol-btn--ghost">See plans</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .ol-hero {
        padding: clamp(3.5rem, 7vw, 7rem) 0 2rem;
      }

      .ol-hero__content {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: clamp(2rem, 5vw, 4rem);
        align-items: center;
      }

      .ol-hero__copy {
        max-width: 38rem;
      }

      .ol-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.8rem;
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary-deep);
        border: 1px solid rgba(255, 122, 26, 0.18);
        border-radius: var(--ol-radius-full);
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 1rem;
      }

      .ol-hero h1 {
        margin-bottom: 1.2rem;
      }

      .ol-hero__lede {
        max-width: 40rem;
        font-size: clamp(1.05rem, 1.8vw, 1.3rem);
        line-height: 1.7;
        margin-bottom: 2rem;
      }

      .ol-hero__cta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
      }

      .ol-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3.1rem;
        padding: 0.82rem 1.3rem;
        border-radius: var(--ol-radius-md);
        font-weight: var(--ol-fw-semibold);
        font-size: var(--ol-fs-sm);
        border: 1px solid transparent;
        transition: all var(--ol-dur-base) var(--ol-ease);
      }

      .ol-btn--primary {
        background: linear-gradient(135deg, var(--ol-color-primary) 0%, #ff9347 100%);
        color: var(--ol-color-on-primary);
        box-shadow: var(--ol-shadow-md);
      }

      .ol-btn--primary:hover {
        background: linear-gradient(135deg, var(--ol-color-primary-hover) 0%, #ef7b2a 100%);
        color: var(--ol-color-on-primary);
      }

      .ol-btn--ghost {
        background: rgba(255, 255, 255, 0.7);
        color: var(--ol-color-fg);
        border-color: var(--ol-color-border-strong);
      }

      .ol-btn--ghost:hover {
        background: var(--ol-color-bg-muted);
        color: var(--ol-color-fg);
      }

      .ol-hero__trust {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .ol-hero__trust span {
        display: inline-flex;
        padding: 0.45rem 0.7rem;
        border-radius: var(--ol-radius-full);
        background: rgba(255, 255, 255, 0.75);
        border: 1px solid var(--ol-color-border);
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }

      .ol-hero__visual {
        display: flex;
        justify-content: center;
      }

      .ol-preview-card {
        width: min(100%, 28rem);
        padding: 1.1rem;
        background: linear-gradient(180deg, #fff, #fff7f2);
        border: 1px solid rgba(234, 178, 138, 0.5);
        border-radius: 1.6rem;
        box-shadow: var(--ol-shadow-lg);
      }

      .ol-preview-card__header {
        display: flex;
        gap: 0.5rem;
        padding-bottom: 1rem;
      }

      .ol-preview-card__dot {
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 50%;
        background: #f1d9c8;
      }

      .ol-preview-card__dot--orange {
        background: var(--ol-color-primary);
      }

      .ol-preview-card__body {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.3rem 0.25rem;
      }

      .ol-score-ring {
        width: 7rem;
        height: 7rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: conic-gradient(var(--ol-color-primary) 0 72%, #f7e7db 72% 100%);
        position: relative;
      }

      .ol-score-ring::before {
        content: "";
        position: absolute;
        inset: 0.8rem;
        border-radius: 50%;
        background: #fff;
      }

      .ol-score-ring__value {
        position: relative;
        z-index: 1;
        font-size: 1.25rem;
        font-weight: var(--ol-fw-bold);
        color: var(--ol-color-fg);
      }

      .ol-preview-card__meta {
        display: grid;
        gap: 1rem;
        flex: 1;
      }

      .ol-preview-card__meta label {
        display: block;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-xs);
        margin-bottom: 0.2rem;
      }

      .ol-preview-card__meta strong {
        color: var(--ol-color-fg);
        font-size: var(--ol-fs-sm);
      }

      .ol-preview-card__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        padding-top: 0.9rem;
        border-top: 1px solid var(--ol-color-border);
      }

      .ol-preview-card__tags span {
        display: inline-flex;
        padding: 0.45rem 0.7rem;
        border-radius: var(--ol-radius-full);
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary-deep);
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
      }

      .ol-metrics__grid,
      .ol-card-grid,
      .ol-step-grid {
        display: grid;
        gap: 1.2rem;
      }

      .ol-metrics__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .ol-metrics article,
      .ol-feature-card,
      .ol-step-grid article {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid var(--ol-color-border);
        border-radius: var(--ol-radius-lg);
        box-shadow: var(--ol-shadow-sm);
      }

      .ol-metrics article {
        padding: 1.2rem;
      }

      .ol-metrics strong {
        display: block;
        color: var(--ol-color-fg);
        font-size: clamp(1.4rem, 2vw, 2rem);
        margin-bottom: 0.3rem;
      }

      .ol-metrics span {
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }

      .ol-section__heading {
        margin-bottom: 2rem;
      }

      .ol-card-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .ol-feature-card {
        padding: 1.5rem;
      }

      .ol-feature-card__icon {
        display: inline-grid;
        place-items: center;
        width: 2.8rem;
        height: 2.8rem;
        border-radius: 0.9rem;
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary-deep);
        font-weight: var(--ol-fw-bold);
        margin-bottom: 1rem;
      }

      .ol-feature-card h3,
      .ol-step-grid h3 {
        margin-bottom: 0.7rem;
      }

      .ol-step-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .ol-step-grid article {
        padding: 1.5rem;
      }

      .ol-step-grid span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 50%;
        background: var(--ol-color-primary-soft);
        color: var(--ol-color-primary-deep);
        font-weight: var(--ol-fw-bold);
        margin-bottom: 1rem;
      }

      .ol-final-cta__panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: clamp(1.4rem, 3vw, 2.2rem);
        background: linear-gradient(135deg, rgba(255, 122, 26, 0.08), rgba(255, 255, 255, 0.9));
        border: 1px solid rgba(234, 178, 138, 0.5);
        border-radius: var(--ol-radius-xl);
        box-shadow: var(--ol-shadow-sm);
      }

      .ol-final-cta__actions {
        display: flex;
        gap: 0.9rem;
        flex-wrap: wrap;
      }

      @media (max-width: 860px) {
        .ol-hero__content,
        .ol-card-grid,
        .ol-step-grid,
        .ol-metrics__grid,
        .ol-final-cta__panel {
          grid-template-columns: 1fr;
          display: grid;
        }

        .ol-final-cta__panel {
          justify-content: stretch;
        }
      }

      @media (max-width: 640px) {
        .ol-hero__cta,
        .ol-final-cta__actions {
          flex-direction: column;
          align-items: stretch;
        }

        .ol-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class LandingComponent {}
