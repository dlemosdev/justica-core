import {Inject, Injectable} from '@angular/core';

import {JusticaAppErro, JusticaLogErro} from '../models/justica-log-erro-config';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';

@Injectable({
  providedIn: 'root'
})
export class JusticaLogErroService {
  private readonly _erroKey = 'erros';

  constructor(
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  listarErros(): JusticaLogErro[] {
    const erros = this._window.localStorage.getItem(this._erroKey);
    if (!erros) {
      return [];
    }

    try {
      const logs = JSON.parse(erros);
      return Array.isArray(logs)
        ? logs.map((log) => this.normalizarLogErro(log)).filter(this.existeLogErro)
        : [];
    } catch (_) {
      return [];
    }
  }

  limparErros(): void {
    this._window.localStorage.removeItem(this._erroKey);
  }

  montarHtml(logs: JusticaLogErro[] = this.listarErros()): string {
    return [
      '<!DOCTYPE html>',
      '<html lang="pt-br">',
      '<head>',
      '<meta charset="utf-8">',
      '<style>',
      this.montarCss(),
      '</style>',
      '</head>',
      '<body>',
      '<ul>',
      ...logs.map((log) => this.montarItemLog(log)),
      '</ul>',
      '<div class="json">',
      this.escaparHtml(JSON.stringify(logs)),
      '</div>',
      '</body>',
      '</html>'
    ].join('');
  }

  exportarHtml(nomeArquivo = 'lista_erros.html', logs: JusticaLogErro[] = this.listarErros()): void {
    const html = this.montarHtml(logs);
    const elemento = this._window.document.createElement('a');
    elemento.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    elemento.download = nomeArquivo;

    this._window.document.body.appendChild(elemento);
    elemento.click();
    this._window.document.body.removeChild(elemento);
  }

  private montarCss(): string {
    return [
      'body { line-height: 1.5em; margin: 40px 50px; overflow-x: hidden; }',
      'ul { list-style: none; margin: 0; padding: 0; }',
      'li { padding: 15px 0; border-bottom: 5px solid grey; }',
      'code { color: red; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }',
      '.json { color: grey; margin: 10px 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }',
      '.titulo { font-weight: bold; }'
    ].join('');
  }

  private montarItemLog(log: JusticaLogErro): string {
    const erro = log.erro as JusticaAppErro | null;

    return [
      '<li>',
      '<div>',
      '<label class="titulo">Modulo:</label> ',
      this.escaparHtml(log.modulo),
      '<label class="titulo" style="margin-left:25px">Data:</label> ',
      this.escaparHtml(this.formatarData(log.data)),
      '</div>',
      erro ? this.montarDetalheErro(erro) : '',
      '</li>'
    ].join('');
  }

  private normalizarLogErro(log: unknown): JusticaLogErro | null {
    if (!log || typeof log !== 'object') {
      return null;
    }

    const logSalvo = log as Partial<JusticaLogErro>;
    const data = this.normalizarData(logSalvo.data);

    return new JusticaLogErro(this.normalizarValor(logSalvo.modulo), data, logSalvo.erro);
  }

  private existeLogErro(log: JusticaLogErro | null): log is JusticaLogErro {
    return !!log;
  }

  private normalizarData(data: Date | string | undefined): Date {
    if (data instanceof Date) {
      return data;
    }

    const dataLog = data ? new Date(data) : new Date('');
    return isNaN(dataLog.getTime()) ? new Date('') : dataLog;
  }

  private montarDetalheErro(erro: JusticaAppErro): string {
    return [
      this.montarCampo('Status', erro.status),
      this.montarCampo('Titulo', erro.title),
      this.montarCampo('Detalhe', erro.detail || erro.message),
      this.montarCampo('Status Http', erro.httpStatus),
      this.montarCampo('Recurso', erro.resource),
      this.montarCampo('Chave', erro.errorKey),
      this.montarCampo('HTTP Metodo', erro.metodoHttp),
      this.montarCampo('URL', erro.path),
      this.montarCampo('Dados do usuario logado', erro.dataUser),
      this.montarCampo('Classe', erro.className),
      this.montarCampo('Metodo', erro.methodName),
      this.montarCampo('Linha', erro.numLineErro),
      this.montarCampo('Nome da excecao', erro.exceptionName || erro.exception),
      this.montarCampo('Erro', erro.error),
      this.montarCampo('Parametros enviados', this.normalizarValorObjeto(erro.parametrosExtras)),
      this.montarCodigo(erro.cause),
      this.montarCodigo(erro.stackTraceCause),
      this.montarCodigo(erro.stack)
    ].join('');
  }

  private montarCampo(rotulo: string, valor: unknown): string {
    const valorNormalizado = this.normalizarValor(valor);
    if (!valorNormalizado) {
      return '';
    }

    return [
      '<div>',
      '<label class="titulo">',
      this.escaparHtml(rotulo),
      ':</label> ',
      this.escaparHtml(valorNormalizado),
      '</div>'
    ].join('');
  }

  private montarCodigo(valor: unknown): string {
    const valorNormalizado = this.normalizarValor(valor);
    if (!valorNormalizado) {
      return '';
    }

    return ['<div><code>', this.escaparHtml(valorNormalizado), '</code></div>'].join('');
  }

  private formatarData(data: Date | string): string {
    const dataLog = data instanceof Date ? data : new Date(data);
    if (isNaN(dataLog.getTime())) {
      return '';
    }

    return [
      this.preencherZero(dataLog.getDate()),
      '/',
      this.preencherZero(dataLog.getMonth() + 1),
      '/',
      dataLog.getFullYear(),
      ' ',
      this.preencherZero(dataLog.getHours()),
      ':',
      this.preencherZero(dataLog.getMinutes()),
      ':',
      this.preencherZero(dataLog.getSeconds())
    ].join('');
  }

  private preencherZero(valor: number): string {
    return valor < 10 ? '0' + valor : String(valor);
  }

  private normalizarValor(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    return String(valor);
  }

  private normalizarValorObjeto(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }

    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  }

  private escaparHtml(valor: unknown): string {
    return this.normalizarValor(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
