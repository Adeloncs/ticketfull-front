import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';

/** Rotas da área do organizador (lazy, exigem papel ORGANIZER ou ADMIN). */
export const ORGANIZER_ROUTES: Routes = [
  {
    path: 'events',
    canActivate: [roleGuard('ORGANIZER', 'ADMIN')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./my-events/my-events.component').then((m) => m.MyEventsComponent),
        title: 'Meus eventos · Ticketfull',
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./event-form/event-form.component').then((m) => m.EventFormComponent),
        title: 'Novo evento · Ticketfull',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./event-manage/event-manage.component').then((m) => m.EventManageComponent),
        title: 'Gerenciar evento · Ticketfull',
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./event-form/event-form.component').then((m) => m.EventFormComponent),
        title: 'Editar evento · Ticketfull',
      },
    ],
  },
  {
    path: 'checkin',
    canActivate: [roleGuard('ORGANIZER', 'ADMIN')],
    loadComponent: () => import('./checkin/checkin.component').then((m) => m.CheckinComponent),
    title: 'Check-in · Ticketfull',
  },
  { path: '', redirectTo: 'events', pathMatch: 'full' },
];
