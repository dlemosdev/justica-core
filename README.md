# justica-core-workspace

Workspace Angular 11 para desenvolvimento, teste, empacotamento e publicação da biblioteca `@justica/core`.

## Visão Geral

Este repositório contém uma biblioteca Angular corporativa voltada para autenticação em aplicações que recebem tokens de uma aplicação externa integrada ao Keycloak.

A lib `@justica/core`:

- lê `access_token` e `refresh_token` do `localStorage`;
- decodifica JWT;
- expõe dados do usuário logado;
- adiciona `Authorization: Bearer` nas requisições;
- executa refresh preventivo;
- monitora inatividade do usuario com dialogo e contador regressivo;
- fornece componentes visuais simples para fluxos corporativos;
- trata fallback por erro `401`;
- evita múltiplos refresh simultâneos;
- mantém cache em memória;
- não implementa tela ou endpoint de login.

## Requisitos

- Node.js compatível com Angular CLI 11.
- npm.
- Docker, apenas para uso do Verdaccio local.

Principais versões do workspace:

| Pacote         | Versão     |
| -------------- | ---------- |
| Angular        | `~11.2.14` |
| Angular CLI    | `~11.2.19` |
| TypeScript     | `~4.1.5`   |
| RxJS           | `~6.6.0`   |
| ng-packagr     | `^11.0.0`  |
| ESLint         | `^7.32.0`  |
| angular-eslint | `^4.3.0`   |

## Scripts

| Comando                                                                  | Descrição                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------- |
| `npm install`                                                            | Instala dependências do workspace.                  |
| `npm run build -- justica-core`                                          | Build da lib em modo padrão.                        |
| `npm run build:justica-core`                                             | Build de produção da lib.                           |
| `npm run watch:justica-core`                                             | Build contínuo da lib.                              |
| `npm run lint`                                                           | Executa ESLint.                                     |
| `npm run format`                                                         | Formata arquivos com Prettier.                      |
| `npm run format:check`                                                   | Verifica formatação com Prettier.                   |
| `npx ng test justica-core --watch=false --browsers=ChromeHeadlessSemGpu` | Executa testes unitários em modo headless.          |
| `npm run pack:ui`                                                        | Gera pacote `.tgz` a partir de `dist/justica-core`. |
| `npm run verdaccio:up`                                                   | Sobe registry local via Docker Compose.             |
| `npm run publish:local`                                                  | Publica no Verdaccio local.                         |
| `npm run publish:snapshot`                                               | Publica no registry snapshot.                       |
| `npm run publish:release`                                                | Publica no registry release.                        |

## Organização do Projeto

```txt
.
  projects/justica-core/
    src/lib/              implementação interna da lib
    src/public-api.ts     API primária do pacote @justica/core
    components/           secondary entry point @justica/core/components
    guards/               secondary entry point @justica/core/guards
    interceptors/         secondary entry point @justica/core/interceptors
    models/               secondary entry point @justica/core/models
    services/             secondary entry point @justica/core/services
    tokens/               secondary entry point @justica/core/tokens
    utils/                secondary entry point @justica/core/utils
```

## Entry Points

A API primária exporta todos os símbolos públicos:

```ts
import {JusticaCoreModule, JusticaUsuarioService} from '@justica/core';
```

Os secondary entry points existem para consumidores que preferem imports segmentados:

```ts
import {JusticaAutenticadoGuard} from '@justica/core/guards';
import {JusticaDialogModule} from '@justica/core/components';
import {JusticaCoreConfig} from '@justica/core/models';
import {JusticaUsuarioService} from '@justica/core/services';
```

Esses entry points ficam fora de `src/lib` porque fazem parte da API publicada pelo `ng-packagr`.

## Padrões de Desenvolvimento

- Use nomenclatura em PT-BR para classes, métodos e arquivos da lib.
- Mantenha código compatível com Angular 11, TypeScript 4.1 e RxJS 6.
- `JusticaCoreModule.forRoot()` é o ponto de entrada para configuração da lib no app consumidor.
- Não implemente fluxo de login dentro da lib.
- Não duplique dados do usuário em `localStorage`; a fonte oficial é o payload do access token.
- Limpe caches de JWT e usuário sempre que tokens forem alterados ou removidos.
- Evite estado `static` em services de autenticação.
- Não crie barrels internos dentro de `projects/justica-core/src/lib`.
- Imports internos da lib devem apontar para arquivos específicos.
- Barrels públicos devem existir apenas como `public-api.ts` da API primária ou dos secondary entry points.

Exemplo correto dentro de `src/lib`:

```ts
import {JusticaCoreConfig} from '../models/justica-core-config';
```

Exemplo proibido dentro de `src/lib`:

```ts
import {JusticaCoreConfig} from '../models';
```

## ESLint

O projeto usa ESLint com `angular-eslint`. O arquivo [.eslintrc.json](./.eslintrc.json) reforça alguns padrões importantes:

- seletores Angular com prefixo `justica`;
- propriedades privadas com `_` inicial;
- `readonly` preferencial em propriedades que não são reatribuídas;
- proibição de `console`, exceto `warn` e `error`;
- proibição de `non-null assertion`;
- limite de linha com aviso em 140 caracteres;
- bloqueio de imports internos via barrel para `models`, `services`, `tokens`, `guards`, `interceptors` e `utils`.

Antes de entregar alterações, execute:

```bash
npm run lint
npm run build -- justica-core
npx ng test justica-core --watch=false --browsers=ChromeHeadlessSemGpu
```

## Uso Básico da Lib

No app consumidor:

```ts
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {JusticaCoreModule} from '@justica/core';

@NgModule({
  imports: [
    HttpClientModule,
    JusticaCoreModule.forRoot({
      chaveAccessToken: 'token',
      chaveRefreshToken: 'refresh_token',
      urlRefreshToken: '/api/auth/refresh',
      margemSegurancaRefreshTokenSegundos: 60,
      rotaLogin: '/login'
    })
  ]
})
export class AppModule {}
```

Inicie a sessão no bootstrap da aplicação:

```ts
import { JusticaSessaoService } from '@justica/core/services';

constructor(
  private readonly _justicaSessaoService: JusticaSessaoService
) {
  this._justicaSessaoService.iniciarMonitoramento();
}
```

## Monitoramento de Inatividade

O pacote possui um monitoramento centralizado de inatividade do usuario. O
alerta visual usa o `JusticaDialogService`, mantendo um unico padrao de dialogo
na aplicacao. O tempo padrao e de 30 minutos para expirar a sessao, com alerta
nos 5 minutos finais. O consumidor pode sobrescrever os tempos e os eventos
monitorados por provider.

```ts
import {NgModule} from '@angular/core';
import {JusticaDialogModule} from '@justica/core/components';
import {JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO} from '@justica/core/models';
import {JUSTICA_INATIVIDADE_USUARIO_CONFIG} from '@justica/core/tokens';

@NgModule({
  imports: [JusticaDialogModule],
  providers: [
    {
      provide: JUSTICA_INATIVIDADE_USUARIO_CONFIG,
      useValue: {
        ...JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO,
        tempoLimiteMinutos: 60,
        tempoAlertaMinutos: 10
      }
    }
  ]
})
export class AppModule {}
```

No componente raiz, inicie o monitoramento e assine o evento de inatividade:

```ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {JusticaInatividadeUsuarioService} from '@justica/core/services';

export class AppComponent implements OnInit, OnDestroy {
  private readonly _subscription = new Subscription();

  constructor(
    private readonly _justicaInatividadeUsuarioService: JusticaInatividadeUsuarioService
  ) {}

  ngOnInit(): void {
    this._justicaInatividadeUsuarioService.iniciarMonitoramento();

    this._subscription.add(
      this._justicaInatividadeUsuarioService.usuarioInativo$.subscribe(() => {
        this.realizarLogoutPorInatividade();
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
```
