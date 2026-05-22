import {InjectionToken} from '@angular/core';

export interface JusticaLocation {
  readonly origin: string;
  href: string;
  pathname: string;
  readonly protocol: string;
  readonly host: string;
  readonly hostname: string;
  readonly port: string;
  search: string;
  hash: string;
  assign(url: string): void;
  reload(): void;
  replace(url: string): void;
}

export interface JusticaStorage {
  readonly length: number;
  clear(): void;
  getItem(chave: string): string | null;
  key(indice: number): string | null;
  removeItem(chave: string): void;
  setItem(chave: string, valor: string): void;
}

export interface JusticaHistory {
  readonly length: number;
  back(): void;
  forward(): void;
  go(delta?: number): void;
  pushState(estado: unknown, titulo: string, url?: string | null): void;
  replaceState(estado: unknown, titulo: string, url?: string | null): void;
}

export interface JusticaNavigator {
  readonly language: string;
  readonly onLine: boolean;
  readonly userAgent: string;
}

export interface JusticaDocumentBody {
  appendChild(elemento: unknown): unknown;
}

export interface JusticaDocument {
  cookie: string;
  readonly body: JusticaDocumentBody;
}

export interface JusticaWindowEvent {
  readonly type: string;
  readonly target?: unknown;
}

export type JusticaWindowEventListener = (evento: JusticaWindowEvent) => void;

export interface JusticaWindow {
  readonly closed: boolean;
  readonly document: JusticaDocument;
  readonly history: JusticaHistory;
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly localStorage: JusticaStorage;
  readonly location: JusticaLocation;
  readonly navigator: JusticaNavigator;
  readonly outerHeight: number;
  readonly outerWidth: number;
  readonly sessionStorage: JusticaStorage;
  addEventListener(tipo: string, listener: JusticaWindowEventListener): void;
  alert(mensagem?: string): void;
  clearInterval(identificador?: number): void;
  clearTimeout(identificador?: number): void;
  confirm(mensagem?: string): boolean;
  focus(): void;
  open(url?: string, target?: string, features?: string): JusticaWindow | null;
  prompt(mensagem?: string, valorPadrao?: string): string | null;
  removeEventListener(tipo: string, listener: JusticaWindowEventListener): void;
  setInterval(callback: (...argumentos: unknown[]) => void, atraso?: number, ...argumentos: unknown[]): number;
  setTimeout(callback: (...argumentos: unknown[]) => void, atraso?: number, ...argumentos: unknown[]): number;
}

export const JUSTICA_WINDOW = new InjectionToken<JusticaWindow>(
  'JUSTICA_WINDOW',
  {
    providedIn: 'root',
    factory: () => window as JusticaWindow
  }
);
