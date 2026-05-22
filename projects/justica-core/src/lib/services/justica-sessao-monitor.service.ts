import {Component, Inject, Injectable, OnDestroy} from '@angular/core';
import {Subscription, timer} from 'rxjs';
import {JusticaTokenStorageService} from './justica-token-storage.service';
import {JusticaTokenUtilService} from './justica-token-util.service';
import {JusticaRefreshTokenService} from './justica-refresh-token.service';
import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {JusticaDialogService} from './justica-dialog.service';
import {JusticaCoreConfig} from '../models/justica-core-config';
import {JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JusticaDialogRef} from '../components/justica-dialog/justica-dialog-ref';
import {JusticaAuthService} from './justica-auth.service';

@Component({
  selector: 'justica-botao-sessao-expirada',
  template: '<button type="button" (click)="confirmar()">OK</button>'
})
export class JusticaBotaoSessaoExpiradaComponent {
  constructor(
    private readonly _dialogRef: JusticaDialogRef,
    private readonly _justicaAuthService: JusticaAuthService
  ) {}

  confirmar(): void {
    this._dialogRef.fechar(true);
    this._justicaAuthService.realizarLogout();
  }
}

@Injectable({
  providedIn: 'root'
})
export class JusticaSessaoMonitorService implements OnDestroy {
  private readonly _cincoMinutosEmMs = 5 * 60 * 1000;
  private readonly _segundosParaRedirecionar = 60;

  private _assinaturaMonitoramento?: Subscription;
  private _assinaturaRedirect?: Subscription;

  constructor(
    private readonly _justicaJwtUtilService: JusticaTokenUtilService,
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _justicaRefreshTokenService: JusticaRefreshTokenService,
    private readonly _justicaDialogService: JusticaDialogService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly _config: JusticaCoreConfig,
    @Inject(JUSTICA_WINDOW)
    private readonly _window: JusticaWindow
  ) {}

  ngOnDestroy(): void {
    this.pararMonitoramento();
  }

  iniciarMonitoramento(): void {
    this.pararMonitoramento();

    const token = this._justicaTokenStorageService.obterToken();
    const refreshToken = this._justicaTokenStorageService.obterRefreshToken();
    const expiracaoToken = this._justicaJwtUtilService.obterExpiracaoEmMillis(token);
    const expiracaoRefreshToken = this._justicaJwtUtilService.obterExpiracaoEmMillis(refreshToken);

    this.atualizarExpiracaoStorage('expToken', expiracaoToken);
    this.atualizarExpiracaoStorage('expRefreshToken', expiracaoRefreshToken);

    if (!token || !refreshToken) {
      this._justicaDialogService
        .warning('Atenção!', 'A sua sessão expirou! Realize novamente o login.')
        .afterClosed()
        .subscribe((confirmou) => {
          if (confirmou) {
            this.realizarLogout();
          }
        });
      return;
    }

    const tempoToken = this._justicaJwtUtilService.obterMilissegundosAteExpirar(token);
    const tempoRefreshToken =
      this._justicaJwtUtilService.obterMilissegundosAteExpirar(refreshToken);

    if (tempoToken === null || tempoRefreshToken === null) {
      this.realizarLogout();
      return;
    }

    if (tempoToken >= tempoRefreshToken) {
      this.alertarNovoLogin();
      return;
    }

    const tempoParaAlerta = tempoRefreshToken - this._cincoMinutosEmMs;

    if (tempoParaAlerta <= 0) {
      this.alertarSessaoExpirando();
      return;
    }

    this._assinaturaMonitoramento = timer(tempoParaAlerta).subscribe(() => {
      this.alertarSessaoExpirando();
    });
  }

  pararMonitoramento(): void {
    if (this._assinaturaMonitoramento) {
      this._assinaturaMonitoramento.unsubscribe();
    }

    if (this._assinaturaRedirect) {
      this._assinaturaRedirect.unsubscribe();
    }
  }

  private alertarSessaoExpirando(): void {
    this._justicaDialogService
      .confirmar('Sua sessão irá expirar em breve', 'Deseja renovar sua sessão?')
      .afterClosed()
      .subscribe((confirmou) => {
        if (!confirmou) {
          return;
        }
        this._justicaRefreshTokenService.renovarToken().subscribe({
          next: () => this.iniciarMonitoramento(),
          error: () => this.alertarNovoLogin()
        });
      });
  }

  private alertarNovoLogin(): void {
    this._justicaDialogService
      .confirmar(
        'Sua sessão não pode mais ser renovada',
        `Você será redirecionado para o login em ${this._segundosParaRedirecionar} segundos.`
      )
      .afterClosed()
      .subscribe((confirmou) => {
        if (confirmou) {
          this.realizarLogout();
          return;
        }
        this.iniciarContagemRedirect();
      });
  }

  private iniciarContagemRedirect(): void {
    this._assinaturaRedirect = timer(this._segundosParaRedirecionar * 1000).subscribe(() =>
      this.realizarLogout()
    );
  }

  private realizarLogout(): void {
    this.pararMonitoramento();
    this._justicaTokenStorageService.limparTokens();
    this._window.location.pathname = this._config.rotaLogin || '/login';
  }

  private atualizarExpiracaoStorage(chave: string, dataHoraExpiracao: Date | null): void {
    if (!dataHoraExpiracao) {
      this._window.localStorage.removeItem(chave);
      return;
    }

    this._window.localStorage.setItem(chave, this.formatarDataHora(dataHoraExpiracao));
  }

  private formatarDataHora(data: Date): string {
    return (
      [
        this.preencherComZero(data.getDate()),
        this.preencherComZero(data.getMonth() + 1),
        data.getFullYear()
      ].join('/') +
      ' ' +
      [
        this.preencherComZero(data.getHours()),
        this.preencherComZero(data.getMinutes()),
        this.preencherComZero(data.getSeconds())
      ].join(':')
    );
  }

  private preencherComZero(valor: number): string {
    return valor < 10 ? '0' + valor : String(valor);
  }
}
