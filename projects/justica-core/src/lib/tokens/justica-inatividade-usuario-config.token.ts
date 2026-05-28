import {InjectionToken, Provider} from '@angular/core';

import {
  criarJusticaInatividadeUsuarioConfig,
  JusticaInatividadeUsuarioConfig
} from '../models/justica-inatividade-usuario-config';
import {JUSTICA_CORE_CONFIG} from './justica-core-config.token';

export {
  criarJusticaInatividadeUsuarioConfig,
  JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO,
  JUSTICA_INATIVIDADE_USUARIO_EVENTOS_MONITORADOS,
  JUSTICA_INATIVIDADE_USUARIO_TEMPO_ALERTA_MINUTOS,
  JUSTICA_INATIVIDADE_USUARIO_TEMPO_LIMITE_MINUTOS
} from '../models/justica-inatividade-usuario-config';

export const JUSTICA_INATIVIDADE_USUARIO_CONFIG =
  new InjectionToken<JusticaInatividadeUsuarioConfig>('JUSTICA_INATIVIDADE_USUARIO_CONFIG', {
    providedIn: 'root',
    factory: criarJusticaInatividadeUsuarioConfig
  });

export function provideJusticaInatividadeUsuarioConfig(config?: JusticaInatividadeUsuarioConfig): Provider[] {
  return [
    {
      provide: JUSTICA_CORE_CONFIG,
      useValue: criarJusticaInatividadeUsuarioConfig(config)
    }
  ];
}
