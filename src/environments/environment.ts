// Ambiente de produção (default). O Nginx do container faz proxy de /api -> backend.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
