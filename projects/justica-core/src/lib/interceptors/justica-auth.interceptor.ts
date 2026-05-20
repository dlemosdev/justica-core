import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { JusticaRefreshTokenService } from '../services/justica-refresh-token.service';
import { JusticaTokenService } from '../services/justica-token.service';

@Injectable()
export class JusticaAuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly _justicaTokenService: JusticaTokenService,
    private readonly _justicaRefreshTokenService: JusticaRefreshTokenService
  ) {}

  intercept(
    requisicao: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.deveIgnorarToken(requisicao)) {
      return next.handle(requisicao);
    }

    const accessToken = this._justicaTokenService.obterAccessToken();
    const requisicaoAutenticada = accessToken
      ? this.adicionarHeaders(requisicao, accessToken)
      : requisicao;

    return next.handle(requisicaoAutenticada).pipe(
      catchError(erro => {
        if (erro instanceof HttpErrorResponse && erro.status === 401) {
          return this.tratarNaoAutorizado(requisicao, next);
        }

        return throwError(erro);
      })
    );
  }

  private tratarNaoAutorizado(
    requisicao: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return this._justicaRefreshTokenService
      .renovarTokenControlado()
      .pipe(
        switchMap(novoAccessToken => {
          const novaRequisicao =
            this.adicionarHeaders(requisicao, novoAccessToken);

          return next.handle(novaRequisicao);
        }),
        catchError(erro => {
          this._justicaTokenService.limparSessao();
          return throwError(erro);
        })
      );
  }

  private adicionarHeaders(
    requisicao: HttpRequest<unknown>,
    accessToken: string
  ): HttpRequest<unknown> {
    return requisicao.clone({
      setHeaders: {
        Authorization: 'Bearer ' + accessToken,
        ContentType: 'application/json',
        'X-XSRF-TOKEN': this.obterCookie('XSRF-TOKEN')
      }
    });
  }

  private deveIgnorarToken(requisicao: HttpRequest<unknown>): boolean {
    const url = requisicao.url.toLowerCase();

    return url.indexOf('/auth/login') >= 0 ||
      url.indexOf('/auth/refresh') >= 0 ||
      url.indexOf('/login') >= 0 ||
      url.indexOf('/refresh') >= 0;
  }

  private obterCookie(nome: string): string {
    const chave = nome + '=';
    const todos = decodeURIComponent(document.cookie || '');
    for (const parte of todos.split(';')) {
      const c = parte.trim();
      if (c.startsWith(chave)) {
        return c.substring(chave.length);
      }
    }
    return '';
  }
}
