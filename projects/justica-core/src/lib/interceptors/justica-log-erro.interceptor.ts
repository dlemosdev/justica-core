import {Inject, Injectable, Provider} from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {from, Observable, throwError} from 'rxjs';
import {catchError, mergeMap} from 'rxjs/operators';

import {
  criarJusticaLogErroConfig,
  JusticaAppErro,
  JusticaLogErro,
  JusticaLogErroConfig
} from '../models/justica-log-erro-config';
import {JUSTICA_LOG_ERRO_CONFIG} from '../tokens/justica-log-erro-config.token';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';

export function provideJusticaLogErroInterceptor(config?: Partial<JusticaLogErroConfig>): Provider[] {
  return [
    {
      provide: JUSTICA_LOG_ERRO_CONFIG,
      useValue: criarJusticaLogErroConfig(config)
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JusticaLogErroInterceptor,
      multi: true
    }
  ];
}

@Injectable()
export class JusticaLogErroInterceptor implements HttpInterceptor {
  private readonly _erroKey = 'erros';

  constructor(
    @Inject(JUSTICA_LOG_ERRO_CONFIG)
    private readonly _logErroConfig: JusticaLogErroConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  intercept(requisicao: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(requisicao).pipe(
      catchError((erro) => {
        if (this._logErroConfig.ativo === false) {
          return throwError(erro);
        }

        return from(this.registrarErro(erro)).pipe(
          catchError((erroRegistro) => {
            console.error(erroRegistro);
            return from([undefined]);
          }),
          mergeMap(() => throwError(erro))
        );
      })
    );
  }

  private async registrarErro(erro: unknown): Promise<void> {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        this.salvarErro(this.criarErroConexao(erro));
        return;
      }

      if (this.deveIgnorarErro(erro.status)) {
        return;
      }

      const appErro = await this.decodificarErro(erro.error);
      this.salvarErro(appErro);
      return;
    }

    const erroRejeitado = this.obterErroRejeitado(erro);
    if (erroRejeitado) {
      if (this.deveIgnorarErro(erroRejeitado.status)) {
        return;
      }

      const appErro = await this.decodificarErro(erroRejeitado.error);
      this.salvarErro(appErro);
      return;
    }

    this.salvarErro(erro);
  }

  private criarErroConexao(erro: HttpErrorResponse): JusticaAppErro {
    return {
      status: erro.status,
      title: erro.statusText,
      path: erro.url,
      cause: erro.message,
      exceptionName: erro.name
    };
  }

  private async decodificarErro(erro: unknown): Promise<JusticaAppErro | unknown> {
    try {
      if (erro instanceof ArrayBuffer) {
        return JSON.parse(this.converterArrayBufferParaTexto(erro));
      }

      if (erro instanceof Blob) {
        return JSON.parse(await erro.text());
      }

      if (typeof erro === 'string') {
        return JSON.parse(erro);
      }

      return erro;
    } catch (_) {
      return null;
    }
  }

  private converterArrayBufferParaTexto(erro: ArrayBuffer): string {
    const bytes = new Uint8Array(erro);
    let texto = '';

    for (let indice = 0; indice < bytes.length; indice += 1) {
      texto += String.fromCharCode(bytes[indice]);
    }

    return texto;
  }

  private salvarErro(appErro: JusticaAppErro | unknown): void {
    if (!appErro) {
      return;
    }

    const errosSalvos = this._window.localStorage.getItem(this._erroKey);
    const logErros = errosSalvos ? this.parseErrosSalvos(errosSalvos) : [];
    logErros.unshift(new JusticaLogErro(this._logErroConfig.modulo, new Date(), appErro));

    if (logErros.length > this.obterNumeroMaximoErros()) {
      logErros.splice(this.obterNumeroMaximoErros());
    }

    this._window.localStorage.setItem(this._erroKey, JSON.stringify(logErros));
  }

  private parseErrosSalvos(errosSalvos: string): JusticaLogErro[] {
    try {
      const logErros = JSON.parse(errosSalvos);
      return Array.isArray(logErros) ? logErros : [];
    } catch (_) {
      return [];
    }
  }

  private obterNumeroMaximoErros(): number {
    return this._logErroConfig.numErros && this._logErroConfig.numErros > 0
      ? this._logErroConfig.numErros
      : 20;
  }

  private deveIgnorarErro(status?: number): boolean {
    return !!(
      status &&
      this._logErroConfig.ignoraStatus &&
      this._logErroConfig.ignoraStatus.indexOf(status) >= 0
    );
  }

  private obterErroRejeitado(erro: unknown): HttpErrorResponse | null {
    if (!erro || typeof erro !== 'object') {
      return null;
    }

    const erroComRejection = erro as {rejection?: {error?: HttpErrorResponse}};
    return erroComRejection.rejection && erroComRejection.rejection.error
      ? erroComRejection.rejection.error
      : null;
  }
}
