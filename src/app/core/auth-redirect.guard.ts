import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

export const authRedirectGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService).client;
  const router = inject(Router);

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return router.createUrlTree(['/']);
  return true;
};
