/**
 * Modelos de autenticação, alinhados ao contrato de /auth.
 *
 * Observação importante sobre papéis (roles):
 * o JWT emitido pelo backend carrega apenas `sub` (email), `jti` e `exp` —
 * NÃO há claim de papel. O backend resolve as authorities consultando o banco
 * a cada requisição, e não existe endpoint `/me`. Portanto o front sabe apenas
 * SE o usuário está autenticado e QUAL o email; o papel não é exposto ao cliente
 * (ver nota no AuthService).
 */

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
  /** expiração do access token em ms (epoch) */
  expiresAt: number;
}
