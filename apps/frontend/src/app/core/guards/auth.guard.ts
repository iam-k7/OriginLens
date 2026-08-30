import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { supabase } from '../supabase.client';

/**
 * Auth guard for private routes.
 *
 * Calls `supabase.auth.getSession()`. If no session exists, redirects to /login.
 * Otherwise allows the navigation.
 *
 * Usage — apply to a route in `app.routes.ts`:
 *   {
 *     path: 'analyzer',
 *     loadComponent: () => import('./features/analyzer/analyzer-page.component')
 *       .then(m => m.AnalyzerPageComponent),
 *     canActivate: [authGuard],
 *   }
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    // Treat any error reading the session as "not authenticated" and bounce to /login.
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url },
    });
  }

  if (!data.session) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url },
    });
  }

  return true;
};
