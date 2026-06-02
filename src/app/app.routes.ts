import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { authRedirectGuard } from './core/auth-redirect.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [authRedirectGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'financiamento',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'despesas',
    loadComponent: () => import('./features/despesas/despesas.component').then(m => m.DespesasComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
