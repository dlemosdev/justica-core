import {Inject, Injectable} from '@angular/core';
import {JUSTICA_ACCESS_TOKEN_KEY, JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JUSTICA_WINDOW, JusticaWindow,} from '../tokens/justica-window.token';
import {JusticaCoreConfig, JUSTICA_REFRESH_TOKEN_KEY} from '../models/justica-core-config';
import {JusticaTokenUtilService} from './justica-token-util.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaTokenStorageService {

  private readonly chaveToken: string;
  private readonly chaveRefreshToken: string;

  constructor(
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow,
    private readonly _justicaJwtUtilService: JusticaTokenUtilService
  ) {
    this.chaveToken = this._config.chaveAccessToken ?? JUSTICA_ACCESS_TOKEN_KEY;
    this.chaveRefreshToken = this._config.chaveRefreshToken ?? JUSTICA_REFRESH_TOKEN_KEY;
  }

  obterToken(): string | null {
    return this._window.localStorage.getItem(this.chaveToken);
  }

  obterRefreshToken(): string | null {
    return this._window.localStorage.getItem(this.chaveRefreshToken);
  }

  salvarTokens(token: string, refreshToken: string): void {
    this._justicaJwtUtilService.limparCache();
    this._window.localStorage.setItem(this.chaveToken, token);
    this._window.localStorage.setItem(this.chaveRefreshToken, refreshToken);
  }

  limparTokens(): void {
    this._justicaJwtUtilService.limparCache();
    this._window.localStorage.removeItem(this.chaveToken);
    this._window.localStorage.removeItem(this.chaveRefreshToken);
  }

  possuiTokens(): boolean {
    return !!this.obterToken() && !!this.obterRefreshToken();
  }
}
