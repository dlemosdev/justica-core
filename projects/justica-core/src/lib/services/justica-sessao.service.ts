import { Inject, Injectable } from '@angular/core';
import { EMPTY, Subscription, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';
import { JusticaJwtService } from './justica-jwt.service';
import { JusticaRefreshTokenService } from './justica-refresh-token.service';
import { JusticaTokenService } from './justica-token.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaSessaoService {
  private _inscricaoRenovacao?: Subscription;

  constructor(
    private readonly _justicaTokenService: JusticaTokenService,
    private readonly _justicaJwtService: JusticaJwtService,
    private readonly _justicaRefreshTokenService: JusticaRefreshTokenService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig
  ) {}

  iniciarMonitoramento(): void {
    this.pararMonitoramento();

    const accessToken = this._justicaTokenService.obterAccessToken();
    const expiracao = this._justicaJwtService.obterExpiracaoEmMillis(accessToken);

    if (!accessToken || !expiracao) {
      return;
    }

    const margemSegurancaRefreshTokenSegundos = this._config.margemSegurancaRefreshTokenSegundos ?? 60;
    const atraso = expiracao - Date.now() - margemSegurancaRefreshTokenSegundos * 1000;

    if (atraso <= 0) {
      this.renovarEReagendar();
      return;
    }

    this._inscricaoRenovacao = timer(atraso)
      .pipe(
        switchMap(() => this._justicaRefreshTokenService.renovarTokenControlado()),
        catchError(() => EMPTY)
      )
      .subscribe(() => {
        this.iniciarMonitoramento();
      });
  }

  pararMonitoramento(): void {
    if (this._inscricaoRenovacao) {
      this._inscricaoRenovacao.unsubscribe();
      this._inscricaoRenovacao = undefined;
    }
  }

  encerrarSessao(): void {
    this.pararMonitoramento();
    this._justicaTokenService.limparSessao();
  }

  private renovarEReagendar(): void {
    this._inscricaoRenovacao = this._justicaRefreshTokenService
      .renovarTokenControlado()
      .pipe(
        catchError(() => EMPTY)
      )
      .subscribe(() => {
        this.iniciarMonitoramento();
      });
  }
}
