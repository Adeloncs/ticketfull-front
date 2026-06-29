/**
 * Modelos de autenticação, alinhados ao contrato de /auth e /me.
 *
 * O backend expõe o papel ao cliente de duas formas:
 * - claim `role` no JWT (para decisão de UI imediata, sem round-trip);
 * - `GET /me` (fonte autoritativa, lida do banco).
 * A autorização fina permanece aplicada no servidor.
 */

/** Papéis do domínio (UserRole no backend). */
export type UserRole = 'ADMIN' | 'ORGANIZER' | 'CUSTOMER' | 'USER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

/** Resposta de /auth/login e /auth/refresh. */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  /** Tempo de vida do access token em milissegundos. */
  expiresIn: number;
}

/** Claims decodificadas do access token (payload do JWT). */
export interface JwtPayload {
  /** subject = email do usuário */
  sub: string;
  /** papel do usuário (claim `role`) */
  role?: UserRole;
  /** id único do token (jti) */
  jti?: string;
  /** expiração em segundos (epoch) */
  exp: number;
  /** emitido em (epoch, segundos) */
  iat?: number;
}

/** Usuário autenticado derivado do token. */
export interface AuthUser {
  email: string;
  /** papel obtido do claim do token (refinado por /me) */
  role: UserRole | null;
  /** expiração do access token em ms (epoch) */
  expiresAt: number;
}

/** Resposta de GET /me — perfil autoritativo do usuário. */
export interface MeResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
