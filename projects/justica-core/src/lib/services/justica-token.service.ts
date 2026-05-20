import { Injectable } from '@angular/core';

import { JusticaToken } from '../models/justica-token';
import { JusticaJwtService } from './justica-jwt.service';
import { JusticaStorageTokenService } from './justica-storage-token.service';
import { JusticaUsuarioService } from './justica-usuario.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaTokenService {
  constructor(
    private readonly _justicaStorageTokenService: JusticaStorageTokenService,
    private readonly _justicaJwtService: JusticaJwtService,
    private readonly _justicaUsuarioService: JusticaUsuarioService
  ) {}

  obterAccessToken(): string | null {
    return this._justicaStorageTokenService.obterAccessToken();
  }

  obterRefreshToken(): string | null {
    return this._justicaStorageTokenService.obterRefreshToken();
  }

  possuiAccessToken(): boolean {
    return this._justicaStorageTokenService.possuiAccessToken();
  }

  possuiRefreshToken(): boolean {
    return this._justicaStorageTokenService.possuiRefreshToken();
  }

  possuiAccessTokenValido(): boolean {
    const token = this.obterAccessToken();

    return !!token && !this._justicaJwtService.estaExpirado(token);
  }

  estaProximoDeExpirar(margemSegundos = 60): boolean {
    const token = this.obterAccessToken();

    return this._justicaJwtService.estaProximoDeExpirar(
      token,
      margemSegundos
    );
  }

  salvarTokens(tokens: JusticaToken): void {
    this._justicaJwtService.limparCache();
    this._justicaUsuarioService.limparCache();
    this._justicaStorageTokenService.salvarTokens(tokens);
  }

  limparSessao(): void {
    this._justicaJwtService.limparCache();
    this._justicaUsuarioService.limparCache();
    this._justicaStorageTokenService.removerTokens();
  }
}
