import { Inject, Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JusticaTokenStorageService } from '../services/justica-token-storage.service';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';

@Injectable({
  providedIn: 'root'
})
export class JusticaAutenticadoGuard implements CanActivate {
  constructor(
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _router: Router,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig
  ) {}

  canActivate(): boolean | UrlTree {
    if (this._justicaTokenStorageService.possuiTokens()) {
      return true;
    }

    return this._router.parseUrl(this._config.rotaLogin || '/login');
  }
}
