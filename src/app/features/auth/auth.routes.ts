import { Routes } from '@angular/router';

/** Rotas da feature de Autenticação (lazy). */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    title: 'Entrar · Ticketfull',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'Criar conta · Ticketfull',
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
