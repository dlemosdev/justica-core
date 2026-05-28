import {
  ApplicationRef,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  Inject,
  Injectable,
  Injector
} from '@angular/core';

import {JusticaDialogComponent} from './justica-dialog.component';
import {JusticaDialogRef} from './justica-dialog-ref';
import {JusticaDialogConfig} from '../../models/justica-dialog-config';
import {JUSTICA_DIALOG_CONFIG} from './justica-dialog.token';
import {JUSTICA_WINDOW, JusticaWindow} from '../../tokens/justica-window.token';

@Injectable({
  providedIn: 'root'
})
export class JusticaDialogService {
  constructor(
    private readonly _componentFactoryResolver: ComponentFactoryResolver,
    private readonly _applicationRef: ApplicationRef,
    private readonly _injector: Injector,
    @Inject(JUSTICA_WINDOW) private readonly _window: JusticaWindow
  ) {}

  abrir(config: JusticaDialogConfig): JusticaDialogRef<boolean> {
    const dialogRef = new JusticaDialogRef<boolean>();
    const dialogConfig: JusticaDialogConfig = {
      textoConfirmar: 'OK',
      textoCancelar: 'Cancelar',
      exibirConfirmar: false,
      exibirCancelar: false,
      tempoFechamentoAutomaticoMs: 1000,
      fecharAoClicarFora: true,
      fecharComEsc: true,
      largura: '32rem',
      tipo: 'info',
      ...config
    };
    const dialogInjector = Injector.create({
      providers: [
        {provide: JusticaDialogRef, useValue: dialogRef},
        {provide: JUSTICA_DIALOG_CONFIG, useValue: dialogConfig}
      ],
      parent: this._injector
    });
    const factory = this._componentFactoryResolver.resolveComponentFactory(JusticaDialogComponent);
    const componentRef = factory.create(dialogInjector);

    componentRef.instance.config = dialogConfig;
    componentRef.instance.dialogRef = dialogRef;

    this._applicationRef.attachView(componentRef.hostView);

    const domElement = (componentRef.hostView as EmbeddedViewRef<unknown>)
      .rootNodes[0] as HTMLElement;

    this._window.document.body.appendChild(domElement);

    dialogRef.afterClosed().subscribe(() => {
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }

      this._applicationRef.detachView(componentRef.hostView);
      componentRef.destroy();
    });

    return dialogRef;
  }

  sucesso(titulo: string, mensagem?: string): JusticaDialogRef<boolean> {
    return this.abrir({
      tipo: 'success',
      titulo,
      mensagem,
      exibirConfirmar: false,
      exibirCancelar: false,
      tempoFechamentoAutomaticoMs: 2000
    });
  }

  info(titulo: string, mensagem?: string): JusticaDialogRef {
    return this.abrir({
      tipo: 'info',
      titulo,
      mensagem,
      exibirConfirmar: true,
      textoConfirmar: 'OK',
      fecharComEsc: false,
      fecharAoClicarFora: false
    });
  }

  warning(titulo: string, mensagem?: string): JusticaDialogRef {
    return this.abrir({
      tipo: 'warning',
      titulo,
      mensagem,
      exibirConfirmar: true,
      textoConfirmar: 'OK',
      fecharComEsc: false,
      fecharAoClicarFora: false
    });
  }

  erro(titulo: string, mensagem?: string): JusticaDialogRef<boolean> {
    return this.abrir({
      tipo: 'error',
      titulo,
      mensagem,
      exibirConfirmar: true,
      textoConfirmar: 'OK',
      fecharComEsc: false,
      fecharAoClicarFora: false
    });
  }

  confirmar(titulo: string, mensagem?: string): JusticaDialogRef<boolean> {
    return this.abrir({
      tipo: 'question',
      titulo,
      mensagem,
      exibirConfirmar: true,
      exibirCancelar: true,
      textoConfirmar: 'Confirmar',
      textoCancelar: 'Cancelar'
    });
  }
}
