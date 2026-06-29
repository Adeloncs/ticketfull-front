import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.model';

const TOKEN_KEY = 'tf.accessToken';

/**
 * Estado de autenticação da aplicação.
 *
 * O estado é exposto via Signals; RxJS é usado apenas nas chamadas HTTP.
 * O access token é persistido em localStorage para sobreviver a reloads.
 *
 * Limitação conhecida: o backend não expõe o papel (role) do usuário ao cliente
 * (sem claim no JWT e sem endpoint /me). Por isso `AuthService` cobre apenas
 * autenticação (logado / não logado). Autorização por papel deve ser validada
 * no backend; um `roleGuard` no front só será viável quando o backend expuser
 * o papel (claim no token ou endpoint de perfil).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /** Token de acesso atual (fonte de verdade do estado de sessão). */
  private readonly accessToken = signal<string | null>(this.readStoredToken());

  /** Usuário autenticado derivado do token, ou null. */
  readonly user = computed<AuthUser | null>(() => {
    const token = this.accessToken();
    if (!token) return null;
    const payload = this.decode(token);
    if (!payload) return null;
    return { email: payload.sub, expiresAt: payload.exp * 1000 };
  });

  /** true quando há token válido e não expirado. */
  readonly isAuthenticated = computed(() => {
    const user = this.user();
    return !!user && user.expiresAt > Date.now();
  });

  readonly userEmail = computed(() => this.user()?.email ?? null);

  /** Refresh em andamento (compartilhado para evitar chamadas concorrentes). */
  private refresh$: Observable<string> | null = null;

  /** Token atual (bruto) para uso pelo interceptor. */
  getAccessToken(): string | null {
    return this.accessToken();
  }

  /** POST /auth/login — autentica e armazena o access token. */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, credentials, { withCredentials: true })
      .pipe(tap((res) => this.setToken(res.accessToken)));
  }

  /** POST /auth/register — cria um CUSTOMER (não autentica). */
  register(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, data);
  }

  /**
   * POST /auth/refresh — renova o access token usando o cookie HttpOnly.
   * Compartilha a mesma requisição entre chamadas concorrentes (lock).
   */
  refreshToken(): Observable<string> {
    if (this.refresh$) return this.refresh$;

    this.refresh$ = this.http
      .post<AuthResponse>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => this.setToken(res.accessToken)),
        map((res) => res.accessToken),
        finalize(() => (this.refresh$ = null)),
        shareReplay(1),
      );

    return this.refresh$;
  }

  /** POST /auth/logout — revoga tokens no servidor e limpa o estado local. */
  logout(): Observable<void> {
    const req = this.http.post<void>(
      `${this.baseUrl}/logout`,
      {},
      { withCredentials: true },
    );
    return req.pipe(tap({ next: () => this.clearToken(), error: () => this.clearToken() }));
  }

  /** Limpa o estado local sem chamar o servidor (ex.: refresh falhou). */
  clearSession(): void {
    this.clearToken();
  }

  // --- internos ---

  private setToken(token: string): void {
    this.accessToken.set(token);
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ambiente sem localStorage (SSR/testes) */
    }
  }

  private clearToken(): void {
    this.accessToken.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Decodifica o payload do JWT (base64url). Retorna null se inválido. */
  private decode(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
