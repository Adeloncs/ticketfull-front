import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  {
    path: 'events',
    loadChildren: () =>
      import('./features/event-catalog/event-catalog.routes').then((m) => m.EVENT_CATALOG_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // Placeholders das demais features (a serem implementadas):
  // { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.routes')... },
  // { path: 'dashboard', loadChildren: () => import('./features/user-dashboard/user-dashboard.routes')... },
  { path: '**', redirectTo: 'events' },
];
