import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

/** Rotas do painel do usuário (lazy, exigem autenticação). */
export const USER_DASHBOARD_ROUTES: Routes = [
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./my-orders/my-orders.component').then((m) => m.MyOrdersComponent),
    title: 'Meus pedidos · Ticketfull',
  },
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
];
