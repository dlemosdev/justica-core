import {InjectionToken, Provider} from '@angular/core';
import {criarJusticaDialogConfig, JusticaDialogConfig} from '../../models/justica-dialog-config';

export const JUSTICA_DIALOG_CONFIG = new InjectionToken<JusticaDialogConfig>(
  'JUSTICA_DIALOG_CONFIG'
);

export function provideJusticaDialogConfig(config: JusticaDialogConfig): Provider[] {
  return [
    {
      provide: JUSTICA_DIALOG_CONFIG,
      useValue: criarJusticaDialogConfig(config)
    }
  ];
}
