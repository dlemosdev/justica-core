import {Inject, Injectable, NgZone} from '@angular/core';
import {
  EMPTY,
  fromEvent,
  interval,
  merge,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
  timer
} from 'rxjs';
import {catchError, finalize, startWith, take} from 'rxjs/operators';

import {JusticaInatividadeUsuarioConfig} from '../models/justica-inatividade-usuario-config';
import {JUSTICA_INATIVIDADE_USUARIO_CONFIG} from '../tokens/justica-inatividade-usuario-config.token';
import {JusticaDialogConfig} from '../models/justica-dialog-config';
import {JusticaDialogRef} from '../components/justica-dialog/justica-dialog-ref';
import {JusticaDialogService} from './justica-dialog.service';
import {JusticaTokenUtilService} from './justica-token-util.service';
import {JusticaRefreshTokenService} from './justica-refresh-token.service';
import {JusticaTokenStorageService} from './justica-token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaInatividadeUsuarioService {
  private readonly _alertaInatividadeUsuarioSubject$ = new Subject<number>();
  private readonly _tempoRestanteMonitoramentoUsuarioSubject$ = new ReplaySubject<string>(1);
  private readonly _usuarioAtivoSubject$ = new Subject<void>();
  private readonly _usuarioInativoSubject$ = new Subject<void>();

  private _inscricaoAtividade?: Subscription;
  private _inscricaoAlerta?: Subscription;
  private _inscricaoContador?: Subscription;
  private _inscricaoTempoRestanteMonitoramento?: Subscription;
  private _inscricaoInatividade?: Subscription;
  private _inscricaoValidacaoSessao?: Subscription;
  private _justicaDialogRef?: JusticaDialogRef<boolean>;
  private _justicaDialogConfig?: JusticaDialogConfig;
  private _alertaAberto = false;
  private _validandoSessao = false;

  readonly alertaInatividadeUsuario$: Observable<number> =
    this._alertaInatividadeUsuarioSubject$.asObservable();

  readonly tempoRestanteMonitoramentoUsuario$: Observable<string> =
    this._tempoRestanteMonitoramentoUsuarioSubject$.asObservable();

  readonly usuarioAtivo$: Observable<void> = this._usuarioAtivoSubject$.asObservable();

  readonly usuarioInativo$: Observable<void> = this._usuarioInativoSubject$.asObservable();

  constructor(
    private readonly _ngZone: NgZone,
    private readonly _justicaDialogService: JusticaDialogService,
    private readonly _justicaTokenStorageService: JusticaTokenStorageService,
    private readonly _justicaJwtUtilService: JusticaTokenUtilService,
    private readonly _justicaRefreshTokenService: JusticaRefreshTokenService,
    @Inject(JUSTICA_INATIVIDADE_USUARIO_CONFIG)
    private readonly _config: JusticaInatividadeUsuarioConfig
  ) {}

  iniciarMonitoramento(): void {
    this.pararMonitoramento();
    this.validarConfiguracao();

    this._ngZone.runOutsideAngular(() => {
      this.monitorarAtividade();
      this.iniciarContadorMonitoramento();
      this.agendarAlerta();
      this.agendarInatividade();
    });
  }

  pararMonitoramento(): void {
    this.cancelarInscricoes();
    this.fecharDialogInatividade();
    this._alertaAberto = false;
  }

  reiniciarMonitoramento(): void {
    this.iniciarMonitoramento();
    this._ngZone.run(() => {
      this._usuarioAtivoSubject$.next();
    });
  }

  private monitorarAtividade(): void {
    const eventos$ = this.eventosMonitorados.map((evento) => fromEvent(document, evento));

    this._inscricaoAtividade = merge(...eventos$).subscribe(() => this.aoDetectarAtividade());
  }

  private agendarAlerta(): void {
    const tempoAntesDoAlertaMs = this.tempoLimiteMs - this.tempoAlertaMs;

    this._inscricaoAlerta = timer(tempoAntesDoAlertaMs).subscribe(() => this.iniciarAlerta());
  }

  private agendarInatividade(): void {
    this._inscricaoInatividade = timer(this.tempoLimiteMs).subscribe(() =>
      this.notificarUsuarioInativo()
    );
  }

  private iniciarContadorMonitoramento(): void {
    this._inscricaoTempoRestanteMonitoramento = interval(1000)
      .pipe(startWith(0), take(this.tempoLimiteSegundos + 1))
      .subscribe((segundoAtual) => {
        const segundosRestantes = this.tempoLimiteSegundos - segundoAtual;

        this._ngZone.run(() => {
          this._tempoRestanteMonitoramentoUsuarioSubject$.next(
            this.formatarTempo(segundosRestantes)
          );
        });
      });
  }

  private iniciarAlerta(): void {
    this._alertaAberto = true;

    this._inscricaoContador = interval(1000)
      .pipe(startWith(0), take(this.tempoAlertaSegundos + 1))
      .subscribe((segundoAtual) => {
        const segundosRestantes = this.tempoAlertaSegundos - segundoAtual;

        this._ngZone.run(() => {
          this.atualizarDialogInatividade(segundosRestantes);
          this._alertaInatividadeUsuarioSubject$.next(segundosRestantes);
        });
      });
  }

  private aoDetectarAtividade(): void {
    const notificarUsuarioAtivo = this._alertaAberto;

    if (this._justicaTokenStorageService.possuiTokens()) {
      this.reiniciarMonitoramentoValidado(notificarUsuarioAtivo);
      return;
    }

    this.tentarRenovarSessaoAntesDeReiniciar(notificarUsuarioAtivo);
  }

  private reiniciarMonitoramentoValidado(notificarUsuarioAtivo: boolean): void {
    if (!notificarUsuarioAtivo) {
      this.reiniciarMonitoramentoSemNotificar();
      return;
    }

    this.reiniciarMonitoramento();
  }

  private tentarRenovarSessaoAntesDeReiniciar(notificarUsuarioAtivo: boolean): void {
    const refreshToken = this._justicaTokenStorageService.obterRefreshToken();

    if (!refreshToken || this._justicaJwtUtilService.estaExpirado(refreshToken)) {
      this.notificarUsuarioInativo();
      return;
    }

    if (this._validandoSessao) {
      return;
    }

    this._validandoSessao = true;
    this._inscricaoValidacaoSessao = this._justicaRefreshTokenService
      .renovarToken()
      .pipe(
        take(1),
        catchError(() => {
          this.notificarUsuarioInativo();
          return EMPTY;
        }),
        finalize(() => {
          this._validandoSessao = false;
          this._inscricaoValidacaoSessao = undefined;
        })
      )
      .subscribe(() => {
        this.reiniciarMonitoramentoValidado(notificarUsuarioAtivo);
      });
  }

  private reiniciarMonitoramentoSemNotificar(): void {
    this.cancelarInscricoes();
    this.fecharDialogInatividade();
    this._alertaAberto = false;

    this._ngZone.runOutsideAngular(() => {
      this.monitorarAtividade();
      this.iniciarContadorMonitoramento();
      this.agendarAlerta();
      this.agendarInatividade();
    });
  }

  private notificarUsuarioInativo(): void {
    this.cancelarInscricoes();
    this.fecharDialogInatividade();
    this._alertaAberto = false;

    this._ngZone.run(() => {
      this._usuarioInativoSubject$.next();
    });
  }

  private cancelarInscricoes(): void {
    this._inscricaoAtividade?.unsubscribe();
    this._inscricaoAlerta?.unsubscribe();
    this._inscricaoContador?.unsubscribe();
    this._inscricaoTempoRestanteMonitoramento?.unsubscribe();
    this._inscricaoInatividade?.unsubscribe();
    this._inscricaoValidacaoSessao?.unsubscribe();

    this._inscricaoAtividade = undefined;
    this._inscricaoAlerta = undefined;
    this._inscricaoContador = undefined;
    this._inscricaoTempoRestanteMonitoramento = undefined;
    this._inscricaoInatividade = undefined;
    this._inscricaoValidacaoSessao = undefined;
    this._validandoSessao = false;
  }

  private atualizarDialogInatividade(segundosRestantes: number): void {
    if (!this._justicaDialogRef || !this._justicaDialogConfig) {
      this.abrirDialogInatividade(segundosRestantes);
      return;
    }

    this._justicaDialogConfig.mensagem = this.criarMensagemInatividade(segundosRestantes);
  }

  private abrirDialogInatividade(segundosRestantes: number): void {
    this._justicaDialogConfig = {
      tipo: 'warning',
      titulo: 'Sessão prestes a expirar',
      mensagem: this.criarMensagemInatividade(segundosRestantes),
      textoConfirmar: 'Continuar',
      exibirConfirmar: true,
      exibirCancelar: false,
      fecharAoClicarFora: false,
      fecharComEsc: false,
      largura: '28rem'
    };

    this._justicaDialogRef = this._justicaDialogService.abrir(this._justicaDialogConfig);

    this._justicaDialogRef.afterClosed().subscribe((continuarSessao) => {
      this._justicaDialogRef = undefined;
      this._justicaDialogConfig = undefined;

      if (continuarSessao) {
        this.reiniciarMonitoramento();
      }
    });
  }

  private fecharDialogInatividade(): void {
    if (!this._justicaDialogRef) {
      this._justicaDialogConfig = undefined;
      return;
    }

    const dialogRef = this._justicaDialogRef;

    this._justicaDialogRef = undefined;
    this._justicaDialogConfig = undefined;
    dialogRef.fechar(false);
  }

  private criarMensagemInatividade(segundosRestantes: number): string {
    return [
      'Voce ainda esta por aí?',
      '',
      'Sua sessão sera encerrada em:',
      this.formatarTempo(segundosRestantes)
    ].join('\n');
  }

  private formatarTempo(segundosRestantes: number): string {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;

    return `${this.formatarParcelaTempo(minutos)}:${this.formatarParcelaTempo(segundos)}`;
  }

  private formatarParcelaTempo(valor: number): string {
    return valor.toString().padStart(2, '0');
  }

  private validarConfiguracao(): void {
    if (this.tempoLimiteMinutos <= 0) {
      throw new Error('tempoLimiteMinutos deve ser maior que zero.');
    }

    if (this.tempoAlertaMinutos <= 0) {
      throw new Error('tempoAlertaMinutos deve ser maior que zero.');
    }

    if (this.tempoAlertaMinutos >= this.tempoLimiteMinutos) {
      throw new Error('tempoAlertaMinutos deve ser menor que tempoLimiteMinutos.');
    }

    if (!this.eventosMonitorados.length) {
      throw new Error('eventosMonitorados deve possuir ao menos um evento.');
    }
  }

  private get config(): JusticaInatividadeUsuarioConfig {
    return this._config;
  }

  private get tempoLimiteMs(): number {
    return this.tempoLimiteMinutos * 60 * 1000;
  }

  private get tempoAlertaMs(): number {
    return this.tempoAlertaMinutos * 60 * 1000;
  }

  private get tempoAlertaSegundos(): number {
    return this.tempoAlertaMinutos * 60;
  }

  private get tempoLimiteSegundos(): number {
    return this.tempoLimiteMinutos * 60;
  }

  private get tempoLimiteMinutos(): number {
    return this.config.tempoLimiteMinutos || 0;
  }

  private get tempoAlertaMinutos(): number {
    return this.config.tempoAlertaMinutos || 0;
  }

  private get eventosMonitorados(): string[] {
    return this.config.eventosMonitorados || [];
  }
}
