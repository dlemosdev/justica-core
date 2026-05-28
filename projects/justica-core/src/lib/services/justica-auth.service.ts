import {Inject, Injectable} from '@angular/core';

import {JusticaCoreConfig} from '../models/justica-core-config';
import {JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {JusticaInatividadeUsuarioService} from './justica-inatividade-usuario.service';
import {JusticaTokenStorageService} from './justica-token-storage.service';
import {JusticaDialogService} from '../components/justica-dialog/justica-dialog.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaAuthService {
  private _logoutEmAndamento = false;

  constructor(
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _justicaInatividadeUsuarioService: JusticaInatividadeUsuarioService,
    private readonly _justicaDialogService: JusticaDialogService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  get logoutEmAndamento(): boolean {
    return this._logoutEmAndamento;
  }

  realizarLogout(): void {
    this._justicaInatividadeUsuarioService.pararMonitoramento();
    this._justicaTokenStorageService.limparTokens();
    this._window.location.pathname = this._config.rotaLogin || '/login';
  }

  alertarSessaoExpirada(): void {
    if (this._logoutEmAndamento) {
      return;
    }

    this._logoutEmAndamento = true;

    this._justicaDialogService
      .warning('Atenção!', 'A sua sessão expirou! Realize novamente o login.')
      .afterClosed()
      .subscribe(() => this.realizarLogout());
  }
}
