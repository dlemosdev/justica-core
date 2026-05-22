import {Injectable} from '@angular/core';
import {JusticaToken} from '../models/justica-token';

@Injectable({
  providedIn: 'root'
})
export class JusticaTokenUtilService {
  private _tokenAtual?: string;
  private _tokenDecodificadoAtual?: JusticaToken;

  decodificarToken(token: string): JusticaToken | null {
    if (!token) {
      return null;
    }

    if (this._tokenAtual === token && this._tokenDecodificadoAtual) {
      return this._tokenDecodificadoAtual;
    }

    try {
      const partes = token.split('.');

      if (partes.length < 2) {
        this.limparCache();
        return null;
      }

      const payloadJson = this.decodificarBase64Url(partes[1]);
      const payload = JSON.parse(payloadJson) as JusticaToken;

      this._tokenAtual = token;
      this._tokenDecodificadoAtual = payload;

      return payload;
    } catch {
      this.limparCache();
      return null;
    }
  }

  obterExpiracaoEmMillis(token: string): Date | null {
    const payload = this.decodificarToken(token);

    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  obterMilissegundosAteExpirar(token: string): number | null {
    const dataExpiracao = this.obterExpiracaoEmMillis(token);

    if (!dataExpiracao) {
      return null;
    }

    return dataExpiracao.getTime() - Date.now();
  }

  estaExpirado(token: string): boolean {
    const tempoRestante = this.obterMilissegundosAteExpirar(token);
    return tempoRestante === null || tempoRestante <= 0;
  }

  limparCache(): void {
    this._tokenAtual = undefined;
    this._tokenDecodificadoAtual = undefined;
  }

  private decodificarBase64Url(valor: string): string {
    const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
    const normalizado = base64.padEnd(
      base64.length + (4 - base64.length % 4) % 4,
      '='
    );
    const texto = atob(normalizado);

    try {
      return decodeURIComponent(
        texto
          .split('')
          .map(caractere => {
            return '%' + ('00' + caractere.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch {
      return texto;
    }
  }
}
