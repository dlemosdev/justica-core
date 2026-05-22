import {ModuleWithProviders, NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {JusticaDialogModule} from './components/justica-dialog/justica-dialog.module';
import {JusticaAuthInterceptor} from './interceptors/justica-auth.interceptor';
import {JusticaCoreConfig} from './models/justica-core-config';
import {provideJusticaCoreConfig} from './tokens/justica-core-config.token';
import {JusticaBotaoSessaoExpiradaComponent} from './services/justica-sessao-monitor.service';

@NgModule({
  declarations: [JusticaBotaoSessaoExpiradaComponent],
  imports: [JusticaDialogModule],
  exports: [JusticaDialogModule]
})
export class JusticaCoreModule {
  static forRoot(config: JusticaCoreConfig = {}): ModuleWithProviders<JusticaCoreModule> {
    return {
      ngModule: JusticaCoreModule,
      providers: [
        provideJusticaCoreConfig(config),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JusticaAuthInterceptor,
          multi: true
        }
      ]
    };
  }
}
