import { Routes } from '@angular/router';

/** Rotas da feature de Catálogo de Eventos (carregadas de forma lazy). */
export const EVENT_CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./event-list/event-list.component').then((m) => m.EventListComponent),
    title: 'Eventos · Ticketfull',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./event-detail/event-detail.component').then((m) => m.EventDetailComponent),
    title: 'Detalhes do evento · Ticketfull',
  },
];
