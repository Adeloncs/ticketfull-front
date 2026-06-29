import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Factory de guard por papel. Exige sessão E um dos papéis informados.
 *
 * O papel é lido do claim `role` do JWT (síncrono, disponível mesmo após reload)
 * e refinado por `GET /me`. A autorização definitiva é sempre feita no backend;
 * este guard apenas evita exibir telas que o usuário não poderia usar.
 *
 * Uso: `canActivate: [roleGuard('ORGANIZER', 'ADMIN')]`
 */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { redirectTo: state.url },
      });
    }

    if (auth.hasAnyRole(...roles)) {
      return true;
    }

    // Autenticado, mas sem o papel necessário.
    return router.createUrlTree(['/events']);
  };
}
