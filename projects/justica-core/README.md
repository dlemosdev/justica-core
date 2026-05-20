# @justica/core

Biblioteca Angular corporativa com base de autenticação para aplicações que já recebem tokens gravados no `localStorage`.

A lib não realiza login. O fluxo esperado é:

1. Uma aplicação externa autentica o usuário no Keycloak.
2. O `access_token` e o `refresh_token` são gravados no `localStorage`.
3. A aplicação consumidora inicializa.
4. `@justica/core` lê os tokens existentes, decodifica o JWT, expõe o usuário logado e renova o token quando necessário.

## Instalação

Instale a partir do registry configurado para o pacote:

```bash
npm install @justica/core
```

O pacote é compilado para Angular 11 e declara como peer dependencies:

```json
{
  "@angular/common": "^11.2.14",
  "@angular/core": "^11.2.14"
}
```

## Configuração

Importe o módulo no módulo raiz da aplicação consumidora. O `JusticaCoreModule.forRoot()` é o ponto de entrada recomendado para registrar a configuração da lib e o interceptor HTTP.

```ts
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { JusticaCoreModule } from '@justica/core';

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

Configurações disponíveis:

| Campo | Descrição |
| --- | --- |
| `urlApi` | URL base da API da aplicação. |
| `urlKeycloack` | URL base do Keycloak. |
| `rotaLogin` | Rota usada pelo guard quando não existir token válido. |
| `chaveAccessToken` | Chave do access token no `localStorage`. |
| `chaveRefreshToken` | Chave do refresh token no `localStorage`. |
| `urlRefreshToken` | Endpoint usado para renovar o access token. |
| `margemSegurancaRefreshTokenSegundos` | Antecedência, em segundos, para o refresh preventivo. |

## Inicialização da Sessão

O `JusticaCoreModule.forRoot()` registra um `APP_INITIALIZER` que inicia o monitoramento preventivo da sessão durante o bootstrap da aplicação.

```ts
JusticaCoreModule.forRoot({
  chaveAccessToken: 'token',
  chaveRefreshToken: 'refresh_token',
  urlRefreshToken: '/api/auth/refresh',
  margemSegurancaRefreshTokenSegundos: 60,
  rotaLogin: '/login'
})
```

As rotas privadas ainda devem usar `JusticaAutenticadoGuard`, pois o monitoramento renova a sessão, mas quem bloqueia navegação com token inválido é o guard.

## Usuário Logado

Os dados do usuário autenticado são extraídos exclusivamente do payload do access token. A lib não duplica dados do usuário no storage.

```ts
import { JusticaUsuarioService } from '@justica/core/services';

const usuario = this._justicaUsuarioService.obterUsuario();
const seqUsuario = this._justicaUsuarioService.obterSeqUsuario();
const seqLocal = this._justicaUsuarioService.obterSeqLocal();
```

Campos esperados no payload:

```ts
seqUsuario: number;
seqLocal: number;
nomeUsuario: string;
nomeLocal: string;
```

## Guard

Use o guard para rotas que exigem access token válido:

```ts
import { JusticaAutenticadoGuard } from '@justica/core/guards';

const routes = [
  {
    path: 'processos',
    canActivate: [JusticaAutenticadoGuard],
    loadChildren: () => import('./processos/processos.module').then(m => m.ProcessosModule)
  }
];
```

## Entry Points

A API primária exporta tudo:

```ts
import { JusticaCoreModule, JusticaUsuarioService } from '@justica/core';
```

Também existem secondary entry points para imports mais direcionados no consumidor:

```ts
import { JusticaAutenticadoGuard } from '@justica/core/guards';
import { JusticaAuthInterceptor } from '@justica/core/interceptors';
import { JusticaCoreConfig } from '@justica/core/models';
import { JusticaUsuarioService } from '@justica/core/services';
import { JUSTICA_CORE_CONFIG } from '@justica/core/tokens';
```

## Desenvolvimento Local

Na raiz do workspace:

```bash
npm install
npm run build -- justica-core
npm run lint
npx ng test justica-core --watch=false --browsers=ChromeHeadlessSemGpu
```

Para desenvolvimento contínuo:

```bash
npm run watch:justica-core
```

Para gerar um pacote local:

```bash
npm run build:justica-core
npm run pack:ui
```

Para publicar no Verdaccio local:

```bash
npm run verdaccio:up
npm run publish:local
```

## Organização Interna

```txt
projects/justica-core
  src/lib/              implementação interna
  src/public-api.ts     API primária do pacote @justica/core
  guards/               secondary entry point @justica/core/guards
  interceptors/         secondary entry point @justica/core/interceptors
  models/               secondary entry point @justica/core/models
  services/             secondary entry point @justica/core/services
  tokens/               secondary entry point @justica/core/tokens
  utils/                secondary entry point @justica/core/utils
```

Não crie `index.ts` dentro de `src/lib`. Imports internos da lib devem apontar para arquivos específicos.
