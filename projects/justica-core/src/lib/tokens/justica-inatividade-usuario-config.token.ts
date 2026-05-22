import { InjectionToken } from '@angular/core';

import {
  criarJusticaInatividadeUsuarioConfig,
  JusticaInatividadeUsuarioConfig
} from '../models/justica-inatividade-usuario-config';

export {
  criarJusticaInatividadeUsuarioConfig,
  JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO,
  JUSTICA_INATIVIDADE_USUARIO_EVENTOS_MONITORADOS,
  JUSTICA_INATIVIDADE_USUARIO_TEMPO_ALERTA_MINUTOS,
  JUSTICA_INATIVIDADE_USUARIO_TEMPO_LIMITE_MINUTOS
} from '../models/justica-inatividade-usuario-config';

export const JUSTICA_INATIVIDADE_USUARIO_CONFIG =
  new InjectionToken<JusticaInatividadeUsuarioConfig>(
    'JUSTICA_INATIVIDADE_USUARIO_CONFIG',
    {
      providedIn: 'root',
      factory: criarJusticaInatividadeUsuarioConfig
    }
  );
