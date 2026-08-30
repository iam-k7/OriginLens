import { Routes } from '@angular/router';

/**
 * Top-level routes. Real components land in their respective feature phases;
 * for Phase 1 we stub the routes so the build succeeds and we can verify
 * navigation works.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'OriginLens — Understand where your content comes from',
  },
  {
    path: 'analyzer',
    loadComponent: () =>
      import('./features/analyzer/analyzer-page.component').then(
        (m) => m.AnalyzerPageComponent,
      ),
    title: 'Image Analyzer · OriginLens',
  },
  {
    path: 'text',
    loadComponent: () =>
      import('./features/text/text-page.component').then((m) => m.TextPageComponent),
    title: 'Text Intelligence · OriginLens',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing-page.component').then(
        (m) => m.PricingPageComponent,
      ),
    title: 'Pricing · OriginLens',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Log in · OriginLens',
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup-page.component').then((m) => m.SignupPageComponent),
    title: 'Sign up · OriginLens',
  },
  { path: '**', redirectTo: '' },
];
