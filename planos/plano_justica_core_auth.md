# plan.md — Implementação enterprise de autenticação, refresh token e usuário autenticado na lib `justica-core`

## 1. Objetivo

Implementar na lib `justica-core` uma base enterprise para consumo de autenticação em aplicações Angular 11 até Angular 21, considerando que:

- O login **não é realizado pela aplicação consumidora**.
- O login é realizado por outra aplicação integrada ao Keycloak.
- A aplicação consumidora apenas recebe e utiliza os tokens já gravados no `localStorage`.
- O `access_token` contém informações do usuário logado.
- O `refresh_token` também já está disponível no `localStorage`.
- A lib deve:
  - ler tokens do `localStorage`;
  - decodificar JWT;
  - expor dados do usuário logado globalmente;
  - renovar token de forma preventiva;
  - tratar fallback por erro `401`;
  - evitar múltiplos refresh simultâneos;
  - manter cache em memória;
  - seguir nomenclatura em PT-BR.

---

## 2. Premissas arquiteturais

### 2.1 O fluxo de login é externo

A aplicação Angular consumidora da `justica-core` **não deve implementar tela ou endpoint de login**.

Fluxo esperado:

```txt
Aplicação externa de login
        ↓
Keycloak
        ↓
Access token e refresh token gerados
        ↓
Tokens gravados no localStorage
        ↓
Aplicação Angular consumidora inicia
        ↓
justica-core lê os tokens existentes
```

### 2.2 Fonte oficial dos dados do usuário

Os dados do usuário autenticado devem vir exclusivamente do payload do JWT.

Não deve existir armazenamento duplicado como:

```txt
justica.usuario
usuarioLogado
dadosUsuario
```

O correto é:

```txt
localStorage
 ├── justica.accessToken
 └── justica.refreshToken

Payload do access_token
 ├── seqUsuario
 ├── seqLocal
 ├── nomeUsuario
 └── nomeLocal
```

---

## 3. Chaves de storage

Definir chaves padronizadas e configuráveis:

```ts
export const JUSTICA_ACCESS_TOKEN_KEY = 'justica.accessToken';

export const JUSTICA_REFRESH_TOKEN_KEY = 'justica.refreshToken';
```

Opcionalmente, permitir sobrescrita via configuração:

```ts
export interface JusticaCoreConfig {
  chaveAccessToken?: string;
  chaveRefreshToken?: string;
  rotaLogin?: string;
  urlRefreshToken?: string;
  margemRenovacaoSegundos?: number;
}
```

---

## 4. Estrutura recomendada

```txt
projects/justica-core/src/lib/auth
 ┣ guards/
 ┃ ┗ justica-autenticado.guard.ts
 ┣ interceptors/
 ┃ ┗ justica-auth.interceptor.ts
 ┣ models/
 ┃ ┣ justica-core-config.ts
 ┃ ┣ justica-jwt-payload.ts
 ┃ ┣ justica-token.ts
 ┃ ┣ justica-refresh-token-request.ts
 ┃ ┣ justica-refresh-token-response.ts
 ┃ ┗ justica-usuario-logado.ts
 ┣ services/
 ┃ ┣ justica-storage-token.service.ts
 ┃ ┣ justica-token.service.ts
 ┃ ┣ justica-jwt.service.ts
 ┃ ┣ justica-usuario.service.ts
 ┃ ┣ justica-refresh-token.service.ts
 ┃ ┗ justica-sessao.service.ts
 ┣ tokens/
 ┃ ┗ justica-core-config.token.ts
 ┗ index.ts
```

---

## 5. Models

### 5.1 `JusticaJwtPayload`

O payload deve contemplar campos padrão do JWT/Keycloak e campos customizados do domínio Justiça.

```ts
export interface JusticaJwtPayload {

  exp?: number;

  iat?: number;

  auth_time?: number;

  jti?: string;

  iss?: string;

  sub?: string;

  typ?: string;

  azp?: string;

  nonce?: string;

  session_state?: string;

  acr?: string;

  scope?: string;

  sid?: string;

  seqUsuario?: number;

  seqLocal?: number;

  nomeUsuario?: string;

  nomeLocal?: string;

  [chave: string]: unknown;

}
```

### 5.2 `JusticaUsuarioLogado`

Modelo centralizado para representar o usuário logado dentro da aplicação.

```ts
export interface JusticaUsuarioLogado {

  seqUsuario: number;

  seqLocal: number;

  nomeUsuario: string;

  nomeLocal: string;

}
```

### 5.3 `JusticaToken`

```ts
export interface JusticaToken {

  accessToken: string;

  refreshToken: string;

}
```

### 5.4 `JusticaRefreshTokenRequest`

```ts
export interface JusticaRefreshTokenRequest {

  refreshToken: string;

}
```

### 5.5 `JusticaRefreshTokenResponse`

```ts
export interface JusticaRefreshTokenResponse {

  accessToken: string;

  refreshToken: string;

}
```

---

## 6. `JusticaStorageTokenService`

Responsável exclusivamente por ler, salvar e remover tokens do storage.

### Responsabilidades

- Ler access token.
- Ler refresh token.
- Salvar tokens.
- Remover tokens.
- Não decodificar JWT.
- Não conhecer usuário logado.
- Não executar refresh.

```ts
import { Inject, Injectable } from '@angular/core';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';
import { JusticaToken } from '../models/justica-token';

@Injectable({
  providedIn: 'root'
})
export class JusticaStorageTokenService {

  private readonly chaveAccessToken: string;

  private readonly chaveRefreshToken: string;

  constructor(
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly config: JusticaCoreConfig
  ) {

    this.chaveAccessToken =
      this.config.chaveAccessToken || 'justica.accessToken';

    this.chaveRefreshToken =
      this.config.chaveRefreshToken || 'justica.refreshToken';
  }

  obterAccessToken(): string | null {
    return localStorage.getItem(this.chaveAccessToken);
  }

  obterRefreshToken(): string | null {
    return localStorage.getItem(this.chaveRefreshToken);
  }

  salvarTokens(tokens: JusticaToken): void {
    localStorage.setItem(this.chaveAccessToken, tokens.accessToken);
    localStorage.setItem(this.chaveRefreshToken, tokens.refreshToken);
  }

  removerTokens(): void {
    localStorage.removeItem(this.chaveAccessToken);
    localStorage.removeItem(this.chaveRefreshToken);
  }

  possuiAccessToken(): boolean {
    return !!this.obterAccessToken();
  }

  possuiRefreshToken(): boolean {
    return !!this.obterRefreshToken();
  }

}
```

---

## 7. `JusticaJwtService`

Serviço enterprise para decodificação e análise do JWT.

### Regras

- Não usar classe `static`.
- Usar serviço singleton via DI.
- Manter cache em memória do payload decodificado.
- Reutilizar payload se o token atual for igual.
- Limpar cache quando token mudar.
- Ser facilmente mockável em testes.

```ts
import { Injectable } from '@angular/core';

import { JusticaJwtPayload } from '../models/justica-jwt-payload';

@Injectable({
  providedIn: 'root'
})
export class JusticaJwtService {

  private tokenAtual?: string;

  private payloadAtual?: JusticaJwtPayload;

  obterPayload(
    token?: string | null
  ): JusticaJwtPayload | null {

    if (!token) {
      return null;
    }

    if (
      this.tokenAtual === token &&
      this.payloadAtual
    ) {
      return this.payloadAtual;
    }

    try {

      const partes =
        token.split('.');

      if (partes.length < 2) {
        this.limparCache();
        return null;
      }

      const payloadJson =
        this.decodificarBase64Url(partes[1]);

      const payload =
        JSON.parse(payloadJson) as JusticaJwtPayload;

      this.tokenAtual = token;
      this.payloadAtual = payload;

      return payload;

    } catch {
      this.limparCache();
      return null;
    }
  }

  obterExpiracaoEmMillis(
    token?: string | null
  ): number | null {

    const payload =
      this.obterPayload(token);

    if (!payload?.exp) {
      return null;
    }

    return payload.exp * 1000;
  }

  estaExpirado(
    token?: string | null
  ): boolean {

    const expiracao =
      this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return true;
    }

    return Date.now() >= expiracao;
  }

  estaProximoDeExpirar(
    token?: string | null,
    margemSegundos = 60
  ): boolean {

    const expiracao =
      this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return true;
    }

    return expiracao - Date.now() <= margemSegundos * 1000;
  }

  obterTempoRestanteEmSegundos(
    token?: string | null
  ): number {

    const expiracao =
      this.obterExpiracaoEmMillis(token);

    if (!expiracao) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor((expiracao - Date.now()) / 1000)
    );
  }

  limparCache(): void {
    this.tokenAtual = undefined;
    this.payloadAtual = undefined;
  }

  private decodificarBase64Url(
    valor: string
  ): string {

    const base64 =
      valor
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const normalizado =
      base64.padEnd(
        base64.length + (4 - base64.length % 4) % 4,
        '='
      );

    const texto =
      atob(normalizado);

    try {
      return decodeURIComponent(
        texto
          .split('')
          .map(caractere => {
            return '%' + ('00' + caractere.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch {
      return texto;
    }
  }

}
```

---

## 8. Gerenciamento centralizado do usuário autenticado

### 8.1 Objetivo

Criar um serviço centralizado para disponibilizar os dados do usuário logado em qualquer ponto da aplicação.

Exemplos de uso:

```ts
this.justicaUsuarioService.obterSeqUsuario();

this.justicaUsuarioService.obterSeqLocal();

this.justicaUsuarioService.obterNomeUsuario();

this.justicaUsuarioService.obterUsuario();
```

### 8.2 Regra principal

O usuário logado **não deve ser salvo separadamente no localStorage**.

A fonte oficial é sempre:

```txt
access_token → payload JWT → JusticaUsuarioService
```

### 8.3 Por que não duplicar no localStorage?

Não salvar `usuarioLogado` separado evita:

- dados inconsistentes após refresh token;
- usuário antigo em cache após troca de sessão;
- divergência entre token e storage;
- necessidade de sincronização manual;
- problemas em múltiplas abas;
- duplicidade de fonte de verdade.

### 8.4 `JusticaUsuarioService`

```ts
import { Injectable } from '@angular/core';

import { JusticaJwtService } from './justica-jwt.service';
import { JusticaStorageTokenService } from './justica-storage-token.service';
import { JusticaUsuarioLogado } from '../models/justica-usuario-logado';

@Injectable({
  providedIn: 'root'
})
export class JusticaUsuarioService {

  private usuarioAtual?: JusticaUsuarioLogado;

  constructor(
    private readonly justicaJwtService: JusticaJwtService,
    private readonly justicaStorageTokenService: JusticaStorageTokenService
  ) {}

  obterUsuario(): JusticaUsuarioLogado | null {

    if (this.usuarioAtual) {
      return this.usuarioAtual;
    }

    const accessToken =
      this.justicaStorageTokenService.obterAccessToken();

    const payload =
      this.justicaJwtService.obterPayload(accessToken);

    if (!payload) {
      return null;
    }

    if (
      payload.seqUsuario == null ||
      payload.seqLocal == null ||
      !payload.nomeUsuario ||
      !payload.nomeLocal
    ) {
      return null;
    }

    this.usuarioAtual = {
      seqUsuario: Number(payload.seqUsuario),
      seqLocal: Number(payload.seqLocal),
      nomeUsuario: String(payload.nomeUsuario),
      nomeLocal: String(payload.nomeLocal)
    };

    return this.usuarioAtual;
  }

  obterSeqUsuario(): number | null {
    return this.obterUsuario()?.seqUsuario ?? null;
  }

  obterSeqLocal(): number | null {
    return this.obterUsuario()?.seqLocal ?? null;
  }

  obterNomeUsuario(): string {
    return this.obterUsuario()?.nomeUsuario ?? '';
  }

  obterNomeLocal(): string {
    return this.obterUsuario()?.nomeLocal ?? '';
  }

  possuiUsuarioLogado(): boolean {
    return !!this.obterUsuario();
  }

  limparCache(): void {
    this.usuarioAtual = undefined;
  }

}
```

### 8.5 Ciclo de vida do cache do usuário

O cache do usuário deve ser limpo sempre que:

- token for salvo;
- token for renovado;
- token for removido;
- logout for executado;
- sessão for invalidada.

---

## 9. `JusticaTokenService`

Serviço de fachada para operações de token.

### Responsabilidades

- Obter tokens.
- Verificar validade do access token.
- Salvar tokens.
- Limpar caches relacionados.
- Não executar HTTP de refresh diretamente.

```ts
import { Injectable } from '@angular/core';

import { JusticaJwtService } from './justica-jwt.service';
import { JusticaStorageTokenService } from './justica-storage-token.service';
import { JusticaUsuarioService } from './justica-usuario.service';
import { JusticaToken } from '../models/justica-token';

@Injectable({
  providedIn: 'root'
})
export class JusticaTokenService {

  constructor(
    private readonly justicaStorageTokenService: JusticaStorageTokenService,
    private readonly justicaJwtService: JusticaJwtService,
    private readonly justicaUsuarioService: JusticaUsuarioService
  ) {}

  obterAccessToken(): string | null {
    return this.justicaStorageTokenService.obterAccessToken();
  }

  obterRefreshToken(): string | null {
    return this.justicaStorageTokenService.obterRefreshToken();
  }

  possuiAccessToken(): boolean {
    return this.justicaStorageTokenService.possuiAccessToken();
  }

  possuiRefreshToken(): boolean {
    return this.justicaStorageTokenService.possuiRefreshToken();
  }

  possuiAccessTokenValido(): boolean {

    const token =
      this.obterAccessToken();

    return !!token && !this.justicaJwtService.estaExpirado(token);
  }

  estaProximoDeExpirar(
    margemSegundos = 60
  ): boolean {

    const token =
      this.obterAccessToken();

    return this.justicaJwtService.estaProximoDeExpirar(
      token,
      margemSegundos
    );
  }

  salvarTokens(
    tokens: JusticaToken
  ): void {

    this.justicaJwtService.limparCache();
    this.justicaUsuarioService.limparCache();

    this.justicaStorageTokenService.salvarTokens(tokens);
  }

  limparSessao(): void {

    this.justicaJwtService.limparCache();
    this.justicaUsuarioService.limparCache();

    this.justicaStorageTokenService.removerTokens();
  }

}
```

---

## 10. `JusticaRefreshTokenService`

Serviço responsável por renovar o access token usando o refresh token.

### Regras enterprise

- Não disparar vários refresh simultâneos.
- Se uma renovação estiver em andamento, novas chamadas devem aguardar.
- Após refresh bem-sucedido:
  - salvar novo access token;
  - salvar novo refresh token, se retornado;
  - limpar cache JWT;
  - limpar cache usuário;
  - liberar requisições pendentes.
- Em erro:
  - limpar sessão;
  - redirecionar para login ou página configurada.

```ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, map, take, tap } from 'rxjs/operators';

import { JusticaCoreConfig } from '../models/justica-core-config';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';
import { JusticaRefreshTokenResponse } from '../models/justica-refresh-token-response';
import { JusticaTokenService } from './justica-token.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaRefreshTokenService {

  private renovandoToken = false;

  private readonly tokenRenovadoSubject =
    new BehaviorSubject<string | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly justicaTokenService: JusticaTokenService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly config: JusticaCoreConfig
  ) {}

  renovarTokenControlado(): Observable<string> {

    if (!this.renovandoToken) {

      this.renovandoToken = true;
      this.tokenRenovadoSubject.next(null);

      return this.renovarToken().pipe(
        tap(accessToken => {
          this.tokenRenovadoSubject.next(accessToken);
        }),
        finalize(() => {
          this.renovandoToken = false;
        })
      );
    }

    return this.tokenRenovadoSubject.pipe(
      filter(token => token !== null),
      take(1),
      map(token => token as string)
    );
  }

  private renovarToken(): Observable<string> {

    const refreshToken =
      this.justicaTokenService.obterRefreshToken();

    if (!refreshToken) {
      this.justicaTokenService.limparSessao();
      return throwError(() => new Error('Refresh token não encontrado.'));
    }

    if (!this.config.urlRefreshToken) {
      return throwError(() => new Error('URL de refresh token não configurada.'));
    }

    return this.http.post<JusticaRefreshTokenResponse>(
      this.config.urlRefreshToken,
      { refreshToken }
    ).pipe(
      tap(resposta => {

        this.justicaTokenService.salvarTokens({
          accessToken: resposta.accessToken,
          refreshToken: resposta.refreshToken || refreshToken
        });
      }),
      map(resposta => resposta.accessToken),
      catchError(erro => {
        this.justicaTokenService.limparSessao();
        return throwError(() => erro);
      })
    );
  }

}
```

---

## 11. Silent refresh preventivo

Criar serviço de sessão para iniciar o monitoramento quando a aplicação carregar.

```ts
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

  private inscricaoRenovacao?: Subscription;

  constructor(
    private readonly justicaTokenService: JusticaTokenService,
    private readonly justicaJwtService: JusticaJwtService,
    private readonly justicaRefreshTokenService: JusticaRefreshTokenService,
    @Inject(JUSTICA_CORE_CONFIG)
    private readonly config: JusticaCoreConfig
  ) {}

  iniciarMonitoramento(): void {

    this.pararMonitoramento();

    const accessToken =
      this.justicaTokenService.obterAccessToken();

    const expiracao =
      this.justicaJwtService.obterExpiracaoEmMillis(accessToken);

    if (!accessToken || !expiracao) {
      return;
    }

    const margemSegundos =
      this.config.margemRenovacaoSegundos ?? 60;

    const atraso =
      expiracao - Date.now() - margemSegundos * 1000;

    if (atraso <= 0) {
      this.renovarEReagendar();
      return;
    }

    this.inscricaoRenovacao =
      timer(atraso)
        .pipe(
          switchMap(() => this.justicaRefreshTokenService.renovarTokenControlado()),
          catchError(() => EMPTY)
        )
        .subscribe(() => {
          this.iniciarMonitoramento();
        });
  }

  pararMonitoramento(): void {
    this.inscricaoRenovacao?.unsubscribe();
    this.inscricaoRenovacao = undefined;
  }

  private renovarEReagendar(): void {
    this.inscricaoRenovacao =
      this.justicaRefreshTokenService
        .renovarTokenControlado()
        .pipe(
          catchError(() => EMPTY)
        )
        .subscribe(() => {
          this.iniciarMonitoramento();
        });
  }

}
```

### Inicialização no app consumidor

A aplicação consumidora deve iniciar o monitoramento no `AppComponent` ou via `APP_INITIALIZER`.

Exemplo simples:

```ts
export class AppComponent {

  constructor(
    private readonly justicaSessaoService: JusticaSessaoService
  ) {
    this.justicaSessaoService.iniciarMonitoramento();
  }

}
```

---

## 12. Interceptor HTTP

### Responsabilidades

- Adicionar `Authorization: Bearer`.
- Ignorar URLs públicas, login e refresh.
- Se receber `401`, tentar refresh controlado.
- Reexecutar a requisição original com novo token.
- Se refresh falhar, limpar sessão.

```ts
import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { JusticaRefreshTokenService } from '../services/justica-refresh-token.service';
import { JusticaTokenService } from '../services/justica-token.service';

@Injectable()
export class JusticaAuthInterceptor implements HttpInterceptor {

  constructor(
    private readonly justicaTokenService: JusticaTokenService,
    private readonly justicaRefreshTokenService: JusticaRefreshTokenService
  ) {}

  intercept(
    requisicao: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    if (this.deveIgnorarToken(requisicao)) {
      return next.handle(requisicao);
    }

    const accessToken =
      this.justicaTokenService.obterAccessToken();

    const requisicaoAutenticada =
      accessToken
        ? this.adicionarToken(requisicao, accessToken)
        : requisicao;

    return next.handle(requisicaoAutenticada).pipe(
      catchError(erro => {

        if (
          erro instanceof HttpErrorResponse &&
          erro.status === 401
        ) {
          return this.tratarNaoAutorizado(requisicao, next);
        }

        return throwError(() => erro);
      })
    );
  }

  private tratarNaoAutorizado(
    requisicao: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    return this.justicaRefreshTokenService
      .renovarTokenControlado()
      .pipe(
        switchMap(novoAccessToken => {

          const novaRequisicao =
            this.adicionarToken(requisicao, novoAccessToken);

          return next.handle(novaRequisicao);
        }),
        catchError(erro => {
          this.justicaTokenService.limparSessao();
          return throwError(() => erro);
        })
      );
  }

  private adicionarToken(
    requisicao: HttpRequest<unknown>,
    accessToken: string
  ): HttpRequest<unknown> {

    return requisicao.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  private deveIgnorarToken(
    requisicao: HttpRequest<unknown>
  ): boolean {

    const url =
      requisicao.url.toLowerCase();

    return url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/login') ||
      url.includes('/refresh');
  }

}
```

---

## 13. Guard de autenticação

Como o login é externo, o guard apenas verifica se existe token válido.

```ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { JusticaTokenService } from '../services/justica-token.service';

@Injectable({
  providedIn: 'root'
})
export class JusticaAutenticadoGuard implements CanActivate {

  constructor(
    private readonly justicaTokenService: JusticaTokenService,
    private readonly router: Router
  ) {}

  canActivate(): boolean | UrlTree {

    if (this.justicaTokenService.possuiAccessTokenValido()) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }

}
```

Observação:

- Usar `createUrlTree` evita `Promise returned from navigate is ignored`.
- Caso a rota de login seja externa, substituir por `window.location.href` em serviço próprio de sessão.

---

## 14. Módulo de configuração

Criar token de configuração:

```ts
import { InjectionToken } from '@angular/core';

import { JusticaCoreConfig } from '../models/justica-core-config';

export const JUSTICA_CORE_CONFIG =
  new InjectionToken<JusticaCoreConfig>('JUSTICA_CORE_CONFIG');
```

Exemplo no app consumidor:

```ts
providers: [
  {
    provide: JUSTICA_CORE_CONFIG,
    useValue: {
      chaveAccessToken: 'justica.accessToken',
      chaveRefreshToken: 'justica.refreshToken',
      urlRefreshToken: '/api/auth/refresh',
      margemRenovacaoSegundos: 60,
      rotaLogin: '/login'
    }
  }
]
```

---

## 15. Exemplo de uso do usuário logado

### Em componente

```ts
export class JusticaCabecalhoComponent {

  usuario =
    this.justicaUsuarioService.obterUsuario();

  constructor(
    private readonly justicaUsuarioService: JusticaUsuarioService
  ) {}

}
```

### Em service

```ts
const seqUsuario =
  this.justicaUsuarioService.obterSeqUsuario();

const seqLocal =
  this.justicaUsuarioService.obterSeqLocal();
```

### Em interceptor adicional

```ts
const usuario =
  this.justicaUsuarioService.obterUsuario();

if (usuario) {
  requisicao = requisicao.clone({
    setHeaders: {
      'X-Seq-Usuario': String(usuario.seqUsuario),
      'X-Seq-Local': String(usuario.seqLocal)
    }
  });
}
```

---

## 16. Boas práticas enterprise

### 16.1 Não duplicar dados

Não salvar dados do usuário fora do token.

Errado:

```txt
localStorage.usuarioLogado
sessionStorage.usuario
window.usuario
```

Certo:

```txt
JWT payload → JusticaUsuarioService → cache em memória
```

### 16.2 Não usar `static` para estado de autenticação

Evitar:

```ts
JusticaJwtUtil.payloadAtual
```

Preferir:

```ts
@Injectable({ providedIn: 'root' })
export class JusticaJwtService {}
```

### 16.3 Limpar caches sempre que token mudar

Ao salvar tokens:

```ts
this.justicaJwtService.limparCache();
this.justicaUsuarioService.limparCache();
```

### 16.4 Refresh com lock

Nunca permitir que 10 requisições simultâneas gerem 10 refresh tokens.

Usar:

```txt
renovandoToken: boolean
BehaviorSubject<string | null>
```

### 16.5 Não renovar token em endpoint de refresh

O interceptor deve ignorar endpoints de login e refresh.

### 16.6 Não esconder erro de sessão inválida

Se refresh falhar:

- limpar tokens;
- limpar cache;
- redirecionar para login;
- não manter usuário antigo em memória.

---

## 17. Checklist para execução pelo Codex

- [x] 1. Criar estrutura de pastas `auth`.
- [x] 2. Criar models:
   - [x] `JusticaJwtPayload`
   - [x] `JusticaUsuarioLogado`
   - [x] `JusticaToken`
   - [x] `JusticaRefreshTokenRequest`
   - [x] `JusticaRefreshTokenResponse`
   - [x] `JusticaCoreConfig`
- [x] 3. Criar token de configuração `JUSTICA_CORE_CONFIG`.
- [x] 4. Criar `JusticaStorageTokenService`.
- [x] 5. Criar `JusticaJwtService`.
- [x] 6. Criar `JusticaUsuarioService`.
- [x] 7. Criar `JusticaTokenService`.
- [x] 8. Criar `JusticaRefreshTokenService`.
- [x] 9. Criar `JusticaSessaoService`.
- [x] 10. Criar `JusticaAuthInterceptor`.
- [x] 11. Criar `JusticaAutenticadoGuard`.
- [x] 12. Exportar tudo no `index.ts`.
- [x] 13. Adicionar exemplos de uso.
- [x] 14. Garantir nomenclatura PT-BR.
- [x] 15. Garantir compatibilidade Angular 11 até 21.
- [x] 16. Criar testes unitários para:
    - [x] decodificação JWT;
    - [x] cache JWT;
    - [x] extração do usuário;
    - [x] refresh controlado;
    - [x] interceptor com `401`;
    - [x] limpeza de sessão.

---

## 18. Critérios de aceite

A implementação será considerada concluída quando:

- A aplicação consumir tokens já existentes no `localStorage`.
- Não existir fluxo de login dentro da lib.
- O access token for anexado automaticamente nas requisições.
- O refresh token for executado preventivamente antes da expiração.
- O interceptor tratar `401` com refresh controlado.
- Múltiplas requisições simultâneas não dispararem múltiplos refresh.
- `seqUsuario`, `seqLocal`, `nomeUsuario` e `nomeLocal` estiverem acessíveis via `JusticaUsuarioService`.
- Dados do usuário não forem duplicados no storage.
- Cache de JWT e usuário for limpo ao trocar tokens.
- O código estiver em PT-BR.
- A implementação estiver pronta para uso em uma lib Angular corporativa.
