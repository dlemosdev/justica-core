import { Inject, Injectable } from '@angular/core';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JusticaToken } from '../models/justica-token';
import {
  JUSTICA_ACCESS_TOKEN_KEY,
  JUSTICA_CORE_CONFIG,
  JUSTICA_REFRESH_TOKEN_KEY
} from '../tokens/justica-core-config.token';

@Injectable({
  providedIn: 'root'
})
export class JusticaStorageTokenService {
  private readonly _chaveAccessToken: string;

  private readonly _chaveRefreshToken: string;

  constructor(
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig
  ) {
    this._chaveAccessToken =
      this._config.chaveAccessToken || JUSTICA_ACCESS_TOKEN_KEY;

    this._chaveRefreshToken =
      this._config.chaveRefreshToken || JUSTICA_REFRESH_TOKEN_KEY;
  }

  obterAccessToken(): string | null {
    return localStorage.getItem(this._chaveAccessToken);
  }

  obterRefreshToken(): string | null {
    return localStorage.getItem(this._chaveRefreshToken);
  }

  salvarTokens(tokens: JusticaToken): void {
    localStorage.setItem(this._chaveAccessToken, tokens.accessToken);
    localStorage.setItem(this._chaveRefreshToken, tokens.refreshToken);
  }

  removerTokens(): void {
    localStorage.removeItem(this._chaveAccessToken);
    localStorage.removeItem(this._chaveRefreshToken);
  }

  possuiAccessToken(): boolean {
    return !!this.obterAccessToken();
  }

  possuiRefreshToken(): boolean {
    return !!this.obterRefreshToken();
  }
}
