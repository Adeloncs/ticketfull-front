import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

/** Rotas da feature de Checkout (lazy, exigem autenticação). */
export const CHECKOUT_ROUTES: Routes = [
  {
    path: ':orderId',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout.component').then((m) => m.CheckoutComponent),
    title: 'Checkout · Ticketfull',
  },
];
