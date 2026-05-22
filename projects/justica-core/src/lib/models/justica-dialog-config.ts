import {Type} from '@angular/core';

export type JusticaDialogTipo =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'question';

export interface JusticaDialogConfig {
  titulo?: string;
  mensagem?: string;
  tipo?: JusticaDialogTipo;

  textoConfirmar?: string;
  textoCancelar?: string;
  componenteBotaoConfirmar?: Type<unknown>;
  componenteBotaoCancelar?: Type<unknown>;
  componenteOutroBotao?: Type<unknown>;

  exibirConfirmar?: boolean;
  exibirCancelar?: boolean;
  tempoFechamentoAutomaticoMs?: number;
  fecharAoClicarFora?: boolean;
  fecharComEsc?: boolean;

  largura?: string;
}
