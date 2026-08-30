import { ChangeDetectionStrategy, Component, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PricingService, Currency, Plan } from '../../core/services/pricing.service';
import { UsageMeterComponent } from '../../shared/components/usage-meter/usage-meter.component';

@Component({
  selector: 'ol-pricing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UsageMeterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
})
export class PricingPageComponent {
  readonly currency = this.pricing.currency;

  readonly info = computed(() => this.pricing.getPricing(this.currency()));

  // Free-tier usage preview (matches QUOTA_FREE_* in .env.example)
  readonly usage = [
    { label: 'Image analysis',     used: 0, limit: 10 },
    { label: 'Sanitize metadata',  used: 0, limit: 5  },
    { label: 'Text analysis',      used: 0, limit: 3  },
    { label: 'Deep scan',          used: 0, limit: 1  },
    { label: 'Rewrite',            used: 0, limit: 3  },
  ];

  constructor(public pricing: PricingService) {}

  setCurrency(c: Currency): void {
    this.pricing.setCurrency(c);
  }

  displayPrice(plan: Plan): string {
    return this.pricing.displayPrice(plan);
  }
}
