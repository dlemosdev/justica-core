import {InjectionToken, Provider} from '@angular/core';

import {
  criarJusticaCoreConfig,
  JusticaCoreConfig
} from '../models/justica-core-config';

export {
  JUSTICA_ACCESS_TOKEN_KEY,
  JUSTICA_API_URL,
  JUSTICA_BASE_URL_KEYCLOACK,
  JUSTICA_CORE_CONFIG_PADRAO,
  JUSTICA_MARGEM_SEGURANCA_REFRESH_TOKEN_EM_SEGUNDOS,
  JUSTICA_REFRESH_TOKEN_KEY,
  criarJusticaCoreConfig
} from '../models/justica-core-config';

export const JUSTICA_CORE_CONFIG = new InjectionToken<JusticaCoreConfig>(
  'JUSTICA_CORE_CONFIG',
  {
    providedIn: 'root',
    factory: criarJusticaCoreConfig
  }
);

export function provideJusticaCoreConfig(config?: JusticaCoreConfig): Provider[] {
  return [
    {
      provide: JUSTICA_CORE_CONFIG,
      useValue: criarJusticaCoreConfig(config)
    }
  ];
}
