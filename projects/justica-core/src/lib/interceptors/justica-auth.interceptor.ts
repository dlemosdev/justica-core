import {Inject, Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';

import {JusticaRefreshTokenService} from '../services/justica-refresh-token.service';
import {JusticaAuthService} from '../services/justica-auth.service';
import {JusticaTokenStorageService} from '../services/justica-token-storage.service';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';

@Injectable()
export class JusticaAuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _justicaRefreshTokenService: JusticaRefreshTokenService,
    private readonly _justicaAuthService: JusticaAuthService,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  intercept(requisicao: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.deveIgnorarToken(requisicao)) {
      return next.handle(requisicao);
    }

    const requisicaoAutenticada = this.adicionarHeaders(requisicao);

    return next.handle(requisicaoAutenticada).pipe(
      catchError((erro) => {
        if (erro instanceof HttpErrorResponse && erro.status === 401) {
          return this.tratarNaoAutorizado(requisicao, next);
        }
        return throwError(() => erro);
      })
    );
  }

  private tratarNaoAutorizado(
    requisicao: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return this._justicaRefreshTokenService.renovarToken().pipe(
      /**
       * Reexecuta request original
       */
      switchMap(() => {
        const requestAtualizada = this.adicionarHeaders(requisicao);
        return next.handle(requestAtualizada);
      }),
      /**
       * Falha no refresh
       */
      catchError((refreshErro) => {
        this._justicaAuthService.realizarLogout();
        return throwError(() => refreshErro);
      })
    );
  }

  private adicionarHeaders(requisicao: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this._justicaTokenStorageService.obterToken();
    if (!token) {
      return requisicao;
    }

    return requisicao.clone({
      setHeaders: {
        Authorization: 'Bearer ' + token,
        ContentType: 'application/json',
        'X-XSRF-TOKEN': this.obterCookie('XSRF-TOKEN')
      }
    });
  }

  private deveIgnorarToken(requisicao: HttpRequest<unknown>): boolean {
    const url = requisicao.url.toLowerCase();
    return url.includes('/token');
  }

  private obterCookie(nome: string): string {
    const chave = nome + '=';
    const todos = decodeURIComponent(this._window.document.cookie || '');
    for (const parte of todos.split(';')) {
      const c = parte.trim();
      if (c.startsWith(chave)) {
        return c.substring(chave.length);
      }
    }
    return '';
  }
}
