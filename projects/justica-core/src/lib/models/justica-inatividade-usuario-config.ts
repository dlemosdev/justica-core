export interface JusticaInatividadeUsuarioConfig {
  /**
   * Tempo total de inatividade até encerrar a sessão.
   *
   * Valor padrão: 30 minutos.
   */
  tempoLimiteMinutos?: number;

  /**
   * Tempo antes do encerramento em que o dialogo será exibido.
   *
   * Valor padrão: 5 minutos.
   */
  tempoAlertaMinutos?: number;

  /**
   * Eventos de navegador usados para identificar atividade do usuário.
   */
  eventosMonitorados?: string[];
}

export const JUSTICA_INATIVIDADE_USUARIO_TEMPO_LIMITE_MINUTOS = 30;
export const JUSTICA_INATIVIDADE_USUARIO_TEMPO_ALERTA_MINUTOS = 5;
export const JUSTICA_INATIVIDADE_USUARIO_EVENTOS_MONITORADOS = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart'
];

export const JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO: JusticaInatividadeUsuarioConfig = {
  tempoLimiteMinutos: JUSTICA_INATIVIDADE_USUARIO_TEMPO_LIMITE_MINUTOS,
  tempoAlertaMinutos: JUSTICA_INATIVIDADE_USUARIO_TEMPO_ALERTA_MINUTOS,
  eventosMonitorados: JUSTICA_INATIVIDADE_USUARIO_EVENTOS_MONITORADOS
};

export function criarJusticaInatividadeUsuarioConfig(
  config: JusticaInatividadeUsuarioConfig = {}
): JusticaInatividadeUsuarioConfig {
  return {
    ...JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO,
    ...config
  };
}
