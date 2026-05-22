import {Inject, Injectable} from '@angular/core';

import {JusticaCoreConfig} from '../models/justica-core-config';
import {JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {JusticaInatividadeUsuarioService} from './justica-inatividade-usuario.service';
import {JusticaTokenStorageService} from './justica-token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaAuthService {
  constructor(
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _justicaInatividadeUsuarioService: JusticaInatividadeUsuarioService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  realizarLogout(): void {
    this._justicaInatividadeUsuarioService.pararMonitoramento();
    this._justicaTokenStorageService.limparTokens();
    this._window.location.pathname = this._config.rotaLogin || '/login';
  }
}
