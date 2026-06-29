import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protege rotas que exigem usuário autenticado.
 * Redireciona para /auth/login preservando a URL de retorno.
 *
 * Nota: autorização por papel (ORGANIZER/ADMIN) NÃO é verificável no cliente
 * hoje — o backend não expõe o papel (sem claim no JWT, sem /me). A autorização
 * fina permanece responsabilidade do backend; aqui validamos apenas a sessão.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirectTo: state.url },
  });
};
