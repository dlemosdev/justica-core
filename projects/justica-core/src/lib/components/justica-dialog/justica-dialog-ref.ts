import {Observable, Subject} from 'rxjs';

export class JusticaDialogRef<T = boolean> {
  private readonly _resultadoSubject = new Subject<T>();
  private _fechado = false;

  afterClosed(): Observable<T> {
    return this._resultadoSubject.asObservable();
  }

  fechar(resultado: T): void {
    if (this._fechado) {
      return;
    }

    this._fechado = true;
    this._resultadoSubject.next(resultado);
    this._resultadoSubject.complete();
  }
}
