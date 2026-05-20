import { Inject, Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JusticaTokenService } from '../services/justica-token.service';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';

@Injectable({
  providedIn: 'root'
})
export class JusticaAutenticadoGuard implements CanActivate {
  constructor(
    private readonly _justicaTokenService: JusticaTokenService,
    private readonly _router: Router,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig
  ) {}

  canActivate(): boolean | UrlTree {
    if (this._justicaTokenService.possuiAccessTokenValido()) {
      return true;
    }

    return this._router.parseUrl(this._config.rotaLogin || '/login');
  }
}
