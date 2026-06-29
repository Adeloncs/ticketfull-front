import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** Endpoints de autenticação que não devem disparar refresh em 401. */
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Interceptor funcional de autenticação:
 * - anexa o header `Authorization: Bearer <token>` quando há sessão;
 * - em `401`, tenta um refresh do token e repete a requisição uma única vez;
 * - se o refresh falhar, limpa a sessão e propaga o erro.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token && !isAuthEndpoint(req.url) ? withBearer(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const is401 = error instanceof HttpErrorResponse && error.status === 401;

      // Não tenta refresh para os próprios endpoints de auth nem sem sessão.
      if (!is401 || isAuthEndpoint(req.url) || !auth.getAccessToken()) {
        return throwError(() => error);
      }

      return refreshAndRetry(req, next, auth);
    }),
  );
};

function refreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
): Observable<HttpEvent<unknown>> {
  return auth.refreshToken().pipe(
    switchMap((newToken) => next(withBearer(req, newToken))),
    catchError((refreshError: unknown) => {
      auth.clearSession();
      return throwError(() => refreshError);
    }),
  );
}
