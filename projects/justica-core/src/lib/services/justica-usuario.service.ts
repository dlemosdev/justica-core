import { Injectable } from '@angular/core';

import { JusticaUsuarioLogado } from '../models/justica-usuario-logado';
import { JusticaJwtService } from './justica-jwt.service';
import { JusticaStorageTokenService } from './justica-storage-token.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaUsuarioService {
  private _usuarioAtual?: JusticaUsuarioLogado;
  private _accessTokenAtual?: string;

  constructor(
    private readonly _justicaJwtService: JusticaJwtService,
    private readonly _justicaStorageTokenService: JusticaStorageTokenService
  ) {}

  obterUsuario(): JusticaUsuarioLogado | null {
    const accessToken = this._justicaStorageTokenService.obterAccessToken();

    if (this._usuarioAtual && this._accessTokenAtual === accessToken) {
      return this._usuarioAtual;
    }

    const payload = this._justicaJwtService.obterPayload(accessToken);

    if (!payload) {
      this.limparCache();
      return null;
    }

    if (
      payload.usuario == null ||
      payload.local == null ||
      !payload.nome ||
      !payload.nomeLocal
    ) {
      this.limparCache();
      return null;
    }

    this._accessTokenAtual = accessToken || undefined;
    this._usuarioAtual = {
      seqUsuario: Number(payload.usuario),
      seqLocal: Number(payload.local),
      nomeUsuario: String(payload.nome),
      nomeLocal: String(payload.nomeLocal)
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
    this._accessTokenAtual = undefined;
  }
}
