import { Injectable } from '@angular/core';

import { JusticaJwtPayload } from '../models/justica-jwt-payload';

@Injectable({
  providedIn: 'root'
})
export class JusticaJwtService {
  private _tokenAtual?: string;

  private _payloadAtual?: JusticaJwtPayload;

  obterPayload(token?: string | null): JusticaJwtPayload | null {
    if (!token) {
      return null;
    }

    if (this._tokenAtual === token && this._payloadAtual) {
      return this._payloadAtual;
    }

    try {
      const partes = token.split('.');

      if (partes.length < 2) {
        this.limparCache();
        return null;
      }

      const payloadJson = this.decodificarBase64Url(partes[1]);
      const payload = JSON.parse(payloadJson) as JusticaJwtPayload;

      this._tokenAtual = token;
      this._payloadAtual = payload;

      return payload;
    } catch {
      this.limparCache();
      return null;
    }
  }

  obterExpiracaoEmMillis(token?: string | null): number | null {
    const payload = this.obterPayload(token);

    if (!payload || !payload.exp) {
      return null;
    }

    return payload.exp * 1000;
  }

  estaExpirado(token?: string | null): boolean {
    const expiracao = this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return true;
    }

    return Date.now() >= expiracao;
  }

  estaProximoDeExpirar(
    token?: string | null,
    margemSegundos = 60
  ): boolean {
    const expiracao = this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return true;
    }

    return expiracao - Date.now() <= margemSegundos * 1000;
  }

  obterTempoRestanteEmSegundos(token?: string | null): number {
    const expiracao = this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return 0;
    }

    return Math.max(0, Math.floor((expiracao - Date.now()) / 1000));
  }

  limparCache(): void {
    this._tokenAtual = undefined;
    this._payloadAtual = undefined;
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
