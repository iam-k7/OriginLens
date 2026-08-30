import { Injectable, signal } from '@angular/core';

export type Currency = 'USD' | 'INR';

export interface Plan {
  id: 'free' | 'pro';
  name: string;
  priceUsd: number;
  priceInr: number;
  features: string[];
  cta: string;
  highlight?: boolean;
}

export interface PricingInfo {
  plans: Plan[];
  currency: Currency;
  fxSource: 'fallback';
  fxUpdatedAt: string;
}

/**
 * Pricing service — Phase 2 stub.
 * Replace with HTTP call to /api/v1/pricing in Phase 10.
 */
@Injectable({ providedIn: 'root' })
export class PricingService {
  readonly currency = signal<Currency>('USD');

  // Fallback rate only; matches FX_USD_TO_INR_FALLBACK in .env.example
  private readonly fx = 83.0;

  private readonly plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      priceUsd: 0,
      priceInr: 0,
      cta: 'Get started',
      features: [
        'Limited image AI analysis',
        '5 metadata sanitizations / month',
        '3 text analyses / month',
        'C2PA, EXIF, AI signal analysis',
        'Reverse-search where available',
        'Files are not permanently stored',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceUsd: 6,
      priceInr: 499,
      cta: 'Upgrade to Pro',
      highlight: true,
      features: [
        'Unlimited supported image analysis',
        'Unlimited metadata sanitization',
        'Unlimited text analysis &amp; rewriting',
        'Deep scan',
        'Priority processing',
        'Future advanced capabilities',
      ],
    },
  ];

  getPricing(currency: Currency): PricingInfo {
    return {
      plans: this.plans,
      currency,
      fxSource: 'fallback',
      fxUpdatedAt: 'static',
    };
  }

  /** Convert a USD amount to the target currency using the fallback rate. */
  convert(usd: number, target: Currency): number {
    if (target === 'INR') {
      // The Pro plan uses a hand-picked INR number for pricing, not a strict
      // conversion. The fallback rate is exposed for transparency in the UI.
      return usd * this.fx;
    }
    return usd;
  }

  /** Display price string like "$6" or "₹499" or "₹ approx.". */
  displayPrice(plan: Plan): string {
    const c = this.currency();
    if (plan.priceUsd === 0) return 'Free';
    if (c === 'USD') return `$${plan.priceUsd}`;
    // For INR, prefer the hand-picked round number when present.
    return `₹${plan.priceInr.toLocaleString('en-IN')}`;
  }

  setCurrency(c: Currency): void {
    this.currency.set(c);
  }
}
