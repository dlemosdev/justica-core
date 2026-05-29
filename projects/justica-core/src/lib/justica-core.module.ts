import {ModuleWithProviders, NgModule} from '@angular/core';

import {JusticaDialogModule} from './components/justica-dialog/justica-dialog.module';
import {JusticaCoreConfig} from './models/justica-core-config';
import {provideJusticaCoreConfig} from './tokens/justica-core-config.token';
import {provideJusticaInatividadeUsuarioConfig} from './tokens/justica-inatividade-usuario-config.token';
import {provideJusticaAuthInterceptor} from './interceptors/justica-auth.interceptor';
import {provideJusticaLogErroInterceptor} from './interceptors/justica-log-erro.interceptor';

@NgModule({
  imports: [JusticaDialogModule],
  exports: [JusticaDialogModule]
})
export class JusticaCoreModule {
  static forRoot(config: JusticaCoreConfig = {}): ModuleWithProviders<JusticaCoreModule> {
    return {
      ngModule: JusticaCoreModule,
      providers: [
        provideJusticaCoreConfig(config),
        provideJusticaAuthInterceptor(),
        provideJusticaLogErroInterceptor({modulo: config.modulo}),
        provideJusticaInatividadeUsuarioConfig({
          ...config.inatividadeUsuario
        })
      ]
    };
  }
}
