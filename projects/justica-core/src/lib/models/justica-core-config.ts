export interface JusticaCoreConfig {
  urlApi?: string;
  urlKeycloack?: string;
  rotaLogin?: string;
  chaveAccessToken?: string;
  chaveRefreshToken?: string;
  margemSegurancaRefreshTokenSegundos?: number;
}

export const JUSTICA_API_URL = '/api/';
export const JUSTICA_BASE_URL_KEYCLOACK = 'https://keycloak-dev.web.stj.jus.br';
export const JUSTICA_ACCESS_TOKEN_KEY = 'token';
export const JUSTICA_REFRESH_TOKEN_KEY = 'refresh_token';
export const JUSTICA_MARGEM_SEGURANCA_REFRESH_TOKEN_EM_SEGUNDOS = 60;
export const JUSTICA_CORE_CONFIG_PADRAO: JusticaCoreConfig = {
  urlApi: JUSTICA_API_URL,
  urlKeycloack: JUSTICA_BASE_URL_KEYCLOACK,
  chaveAccessToken: JUSTICA_ACCESS_TOKEN_KEY,
  chaveRefreshToken: JUSTICA_REFRESH_TOKEN_KEY,
  margemSegurancaRefreshTokenSegundos: JUSTICA_MARGEM_SEGURANCA_REFRESH_TOKEN_EM_SEGUNDOS
};

export function criarJusticaCoreConfig(
  config: JusticaCoreConfig = {}
): JusticaCoreConfig {
  return {
    ...JUSTICA_CORE_CONFIG_PADRAO,
    ...config
  };
}
