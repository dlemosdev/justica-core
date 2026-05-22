import {
  Component,
  HostListener,
  Inject,
  Injector,
  OnDestroy,
  OnInit
} from '@angular/core';

import { JusticaDialogConfig } from '../../models/justica-dialog-config';
import { JusticaDialogRef } from './justica-dialog-ref';
import { JUSTICA_WINDOW, JusticaWindow } from '../../tokens/justica-window.token';

@Component({
  selector: 'justica-dialog',
  templateUrl: './justica-dialog.component.html',
  styleUrls: ['./justica-dialog.component.scss']
})
export class JusticaDialogComponent implements OnInit, OnDestroy {
  config!: JusticaDialogConfig;
  dialogRef!: JusticaDialogRef;
  private _timeoutFechamentoAutomatico?: number;

  constructor(
    readonly injector: Injector,
    @Inject(JUSTICA_WINDOW) private readonly _window: JusticaWindow
  ) {}

  ngOnInit(): void {
    if (this.exibirAcoes) {
      return;
    }

    this._timeoutFechamentoAutomatico = this._window.setTimeout(() => {
      this.cancelar();
    }, this.config.tempoFechamentoAutomaticoMs);
  }

  ngOnDestroy(): void {
    if (this._timeoutFechamentoAutomatico) {
      this._window.clearTimeout(this._timeoutFechamentoAutomatico);
    }
  }

  confirmar(): void {
    this.dialogRef.fechar(true);
  }

  cancelar(): void {
    this.dialogRef.fechar(false);
  }

  fecharPorBackdrop(): void {
    if (this.config.fecharAoClicarFora) {
      this.cancelar();
    }
  }

  impedirFechamento(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  aoPressionarEsc(): void {
    if (this.config.fecharComEsc) {
      this.cancelar();
    }
  }

  get classeIcone(): string {
    return `justica-dialog__icone--${this.config.tipo || 'info'}`;
  }

  get exibirAcoes(): boolean {
    return !!(
      this.config.exibirConfirmar ||
      this.config.exibirCancelar ||
      this.config.componenteOutroBotao
    );
  }

  get simboloIcone(): string {
    switch (this.config.tipo) {
      case 'success':
        return '✓';
      case 'error':
        return '×';
      case 'warning':
        return '!';
      case 'question':
        return '?';
      case 'info':
      default:
        return 'i';
    }
  }
}
