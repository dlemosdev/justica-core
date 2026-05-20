import {
  APP_INITIALIZER,
  ModuleWithProviders,
  NgModule
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { JusticaAuthInterceptor } from './interceptors/justica-auth.interceptor';
import {
  criarJusticaCoreConfig,
  JusticaCoreConfig
} from './models/justica-core-config';
import { JusticaSessaoService } from './services/justica-sessao.service';
import { JUSTICA_CORE_CONFIG } from './tokens/justica-core-config.token';

let justicaSessaoServiceInicializador: JusticaSessaoService | null = null;

export function iniciarMonitoramentoSessao(): void {
  if (!justicaSessaoServiceInicializador) {
    return;
  }

  try {
    justicaSessaoServiceInicializador.iniciarMonitoramento();
  } catch {
    // Nao interrompe o bootstrap da aplicacao em caso de erro.
  }
}

export function iniciarMonitoramentoSessaoFactory(
  justicaSessaoService: JusticaSessaoService
): () => void {
  justicaSessaoServiceInicializador = justicaSessaoService;
  return iniciarMonitoramentoSessao;
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class JusticaCoreModule {
  static forRoot(
    config: JusticaCoreConfig = {}
  ): ModuleWithProviders<JusticaCoreModule> {
    return {
      ngModule: JusticaCoreModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: iniciarMonitoramentoSessaoFactory,
          deps: [
            JusticaSessaoService
          ],
          multi: true
        },
        {
          provide: JUSTICA_CORE_CONFIG,
          useValue: criarJusticaCoreConfig(config)
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JusticaAuthInterceptor,
          multi: true
        }
      ]
    };
  }
}
