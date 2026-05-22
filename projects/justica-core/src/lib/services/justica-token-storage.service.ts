import {Inject, Injectable} from '@angular/core';
import {JUSTICA_ACCESS_TOKEN_KEY, JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {JUSTICA_REFRESH_TOKEN_KEY, JusticaCoreConfig} from '../models/justica-core-config';
import {JusticaTokenUtilService} from './justica-token-util.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaTokenStorageService {
  private readonly _chaveToken: string;
  private readonly _chaveRefreshToken: string;

  constructor(
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow,
    private readonly _justicaJwtUtilService: JusticaTokenUtilService
  ) {
    this._chaveToken = this._config.chaveAccessToken ?? JUSTICA_ACCESS_TOKEN_KEY;
    this._chaveRefreshToken = this._config.chaveRefreshToken ?? JUSTICA_REFRESH_TOKEN_KEY;
  }

  obterToken(): string | null {
    return this._window.localStorage.getItem(this._chaveToken);
  }

  obterRefreshToken(): string | null {
    return this._window.localStorage.getItem(this._chaveRefreshToken);
  }

  salvarTokens(token: string, refreshToken: string): void {
    this._justicaJwtUtilService.limparCache();
    this._window.localStorage.setItem(this._chaveToken, token);
    this._window.localStorage.setItem(this._chaveRefreshToken, refreshToken);
  }

  limparTokens(): void {
    this._justicaJwtUtilService.limparCache();
    this._window.localStorage.removeItem(this._chaveToken);
    this._window.localStorage.removeItem(this._chaveRefreshToken);
  }

  possuiTokens(): boolean {
    return !!this.obterToken() && !!this.obterRefreshToken();
  }
}
