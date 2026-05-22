import {Inject, Injectable, Optional} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';

import {catchError, finalize, shareReplay, tap} from 'rxjs/operators';
import {JusticaTokenStorageService} from './justica-token-storage.service';
import {JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JusticaCoreConfig} from '../models/justica-core-config';
import {JusticaRefreshTokenResponse} from '../models/justica-refresh-token-response';

@Injectable({
  providedIn: 'root'
})
export class JusticaRefreshTokenService {
  private readonly _urlRefreshToken: string;

  /**
   * Guarda refresh em andamento.
   * Todas requests compartilham esta mesma observable.
   */
  private _refreshTokenEmAndamento$?: Observable<JusticaRefreshTokenResponse>;

  constructor(
    @Optional()
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    private readonly _http: HttpClient,
    private readonly _tokenStorageService: JusticaTokenStorageService
  ) {
    this._urlRefreshToken = `${this._config.urlKeycloack}/protocol/openid-connect/token`;
  }

  renovarToken(): Observable<JusticaRefreshTokenResponse> {
    /**
     * Se já existe refresh em andamento:
     * reaproveita mesma request HTTP.
     */
    if (this._refreshTokenEmAndamento$) {
      return this._refreshTokenEmAndamento$;
    }

    const refreshToken = this._tokenStorageService.obterRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('Refresh token não encontrado.'));
    }

    if (!this._config.urlKeycloack) {
      return throwError(new Error('URL de refresh token não configurada.'));
    }

    const params = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
      .set('client_id', 'justica');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this._refreshTokenEmAndamento$ = this._http
      .post<JusticaRefreshTokenResponse>(this._urlRefreshToken, params, {headers})
      .pipe(
        tap((response) => {
          this._tokenStorageService.salvarTokens(response.access_token, response.refresh_token);
        }),

        catchError((erro) => {
          this._tokenStorageService.limparTokens();
          return throwError(() => erro);
        }),

        finalize(() => {
          /**
           * Libera nova renovação futura
           */
          this._refreshTokenEmAndamento$ = undefined;
        }),

        /**
         * Compartilha mesma execução HTTP
         * para múltiplos subscribers.
         */
        shareReplay(1)
      );

    return this._refreshTokenEmAndamento$;
  }
}
