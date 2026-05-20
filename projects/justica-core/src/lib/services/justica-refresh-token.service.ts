import { Inject, Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, map, take, tap } from 'rxjs/operators';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JusticaRefreshTokenRequest } from '../models/justica-refresh-token-request';
import { JusticaRefreshTokenResponse } from '../models/justica-refresh-token-response';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';
import { JusticaTokenService } from './justica-token.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaRefreshTokenService {
  private _renovandoToken = false;

  private readonly _tokenRenovadoSubject$ =
    new BehaviorSubject<string | null>(null);

  constructor(
    private readonly _http: HttpClient,
    private readonly _justicaTokenService: JusticaTokenService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig
  ) {}

  renovarTokenControlado(): Observable<string> {
    if (!this._renovandoToken) {
      this._renovandoToken = true;
      this._tokenRenovadoSubject$.next(null);

      return this.renovarToken().pipe(
        tap(accessToken => {
          this._tokenRenovadoSubject$.next(accessToken);
        }),
        finalize(() => {
          this._renovandoToken = false;
        })
      );
    }

    return this._tokenRenovadoSubject$.pipe(
      filter(token => token !== null),
      take(1),
      map(token => token as string)
    );
  }

  private renovarToken(): Observable<string> {
    const refreshToken = this._justicaTokenService.obterRefreshToken();

    if (!refreshToken) {
      this._justicaTokenService.limparSessao();
      return throwError(new Error('Refresh token nao encontrado.'));
    }

    if (!this._config.urlKeycloack) {
      return throwError(new Error('URL de refresh token nao configurada.'));
    }

    const params = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
      .set('client_id', 'justica');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this._http.post<JusticaRefreshTokenResponse>(
      `${this._config.urlKeycloack}/protocol/openid-connect/token`,
      params.toString(),
      { headers }
    ).pipe(
      tap(resposta => {
        this._justicaTokenService.salvarTokens({
          accessToken: resposta.accessToken,
          refreshToken: resposta.refreshToken || refreshToken
        });
      }),
      map(resposta => resposta.accessToken),
      catchError(erro => {
        this._justicaTokenService.limparSessao();
        return throwError(erro);
      })
    );
  }
}
