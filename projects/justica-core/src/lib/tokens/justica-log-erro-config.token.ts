import {InjectionToken, Provider} from '@angular/core';

import {
  criarJusticaLogErroConfig,
  JusticaLogErroConfig
} from '../models/justica-log-erro-config';
export {criarJusticaLogErroConfig} from '../models/justica-log-erro-config';

export const JUSTICA_LOG_ERRO_CONFIG = new InjectionToken<JusticaLogErroConfig>(
  'JUSTICA_LOG_ERRO_CONFIG',
  {
    providedIn: 'root',
    factory: criarJusticaLogErroConfig
  }
);

export function provideJusticaLogErroConfig(config?: JusticaLogErroConfig): Provider[] {
  return [
    {
      provide: JUSTICA_LOG_ERRO_CONFIG,
      useValue: criarJusticaLogErroConfig(config)
    }
  ];
}
