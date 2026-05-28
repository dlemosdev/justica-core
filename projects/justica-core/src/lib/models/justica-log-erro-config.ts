export interface JusticaLogErroConfig {
  modulo: string;
  numErros?: number;
  ativo?: boolean;
  ignoraStatus?: number[];
}

export interface JusticaAppErro {
  className?: string;
  dataUser?: string;
  detail?: string;
  error?: string;
  errorKey?: string;
  exception?: string;
  status?: number;
  httpStatus?: number | string;
  message?: string;
  metodoHttp?: string;
  methodName?: string;
  numLineErro?: number | string;
  parametrosExtras?: unknown;
  resource?: string;
  stack?: string;
  stackTraceCause?: string;
  title?: string;
  path?: string | null;
  cause?: string;
  exceptionName?: string;
  [chave: string]: unknown;
}

export class JusticaLogErro {
  constructor(
    public readonly modulo: string,
    public readonly data: Date,
    public readonly erro: JusticaAppErro | unknown
  ) {}
}

export const JUSTICA_LOG_ERRO_MODULO_PADRAO = 'MODULO';
export const JUSTICA_LOG_ERRO_NUM_ERROS_PADRAO = 20;

export function criarJusticaLogErroConfig(config?: Partial<JusticaLogErroConfig>): JusticaLogErroConfig {
  if (!config) {
    return {
      modulo: JUSTICA_LOG_ERRO_MODULO_PADRAO,
      numErros: JUSTICA_LOG_ERRO_NUM_ERROS_PADRAO,
      ativo: true,
      ignoraStatus: [401]
    };
  }
  return {
    modulo: config.modulo ?? JUSTICA_LOG_ERRO_MODULO_PADRAO,
    numErros: config.numErros && config.numErros > 0 ? config.numErros : JUSTICA_LOG_ERRO_NUM_ERROS_PADRAO,
    ativo: config.ativo !== false,
    ignoraStatus: config.ignoraStatus ?? [401]
  };
}
