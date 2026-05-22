import { Injectable } from '@angular/core';

import { JusticaUsuarioLogado } from '../models/justica-usuario-logado';
import { JusticaTokenUtilService } from './justica-token-util.service';
import {JusticaTokenStorageService} from './justica-token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaUsuarioService {
  private _usuarioAtual?: JusticaUsuarioLogado;
  private _tokenAtual?: string;

  constructor(
    private readonly _justicaJwtUtilService: JusticaTokenUtilService,
    private readonly _justicaTokenStorageService: JusticaTokenStorageService
  ) {}

  obterUsuario(): JusticaUsuarioLogado | null {
    const token = this._justicaTokenStorageService.obterToken();

    if (this._usuarioAtual && this._tokenAtual === token) {
      return this._usuarioAtual;
    }

    const payloadDecodificado = this._justicaJwtUtilService.decodificarToken(token);

    if (!payloadDecodificado) {
      this.limparCache();
      return null;
    }

    if (
      payloadDecodificado.usuario == null ||
      payloadDecodificado.local == null ||
      !payloadDecodificado.nome ||
      !payloadDecodificado.nomeLocal
    ) {
      this.limparCache();
      return null;
    }

    this._tokenAtual = token || undefined;
    this._usuarioAtual = {
      seqUsuario: Number(payloadDecodificado.usuario),
      seqLocal: Number(payloadDecodificado.local),
      nomeUsuario: String(payloadDecodificado.nome),
      nomeLocal: String(payloadDecodificado.nomeLocal)
    };

    return this._usuarioAtual;
  }

  obterSeqUsuario(): number | null {
    const usuario = this.obterUsuario();
    return usuario ? usuario.seqUsuario : null;
  }

  obterSeqLocal(): number | null {
    const usuario = this.obterUsuario();
    return usuario ? usuario.seqLocal : null;
  }

  obterNomeUsuario(): string {
    const usuario = this.obterUsuario();
    return usuario ? usuario.nomeUsuario : '';
  }

  obterNomeLocal(): string {
    const usuario = this.obterUsuario();
    return usuario ? usuario.nomeLocal : '';
  }

  possuiUsuarioLogado(): boolean {
    return !!this.obterUsuario();
  }

  limparCache(): void {
    this._usuarioAtual = undefined;
    this._tokenAtual = undefined;
  }
}
