# @justica/core

Biblioteca Angular corporativa para padronizar recursos essenciais de aplicações internas do STJ, com foco em autenticação baseada em tokens, renovação de sessão, leitura dos dados do usuário autenticado, proteção de rotas, monitoramento de inatividade e componentes compartilhados de diálogo.

O pacote foi pensado para aplicações que já recebem `access_token` e `refresh_token` gravados no `localStorage` por um fluxo externo de autenticação. A lib centraliza o consumo desses tokens e oferece services, guards, interceptors, tokens de configuração e módulos visuais reutilizáveis, sem assumir a responsabilidade pelo login da aplicação.

A lib não realiza login. O fluxo esperado é:

1. Uma aplicação externa autentica o usuário no provedor de identidade.
2. O `access_token` e o `refresh_token` são gravados no `localStorage`.
3. A aplicação consumidora inicializa.
4. `@justica/core` lê os tokens existentes, decodifica o JWT, expõe o usuário logado, adiciona headers HTTP e renova a sessão quando necessário.

## Instalação

```bash
npm install @justica/core
```

O pacote é compilado para Angular 11 e declara dependências pares de Angular 11:

```json
{
  "@angular/common": "^11.2.14",
  "@angular/core": "^11.2.14"
}
```

## Configuração

Importe o módulo no módulo raiz da aplicação consumidora. O `JusticaCoreModule.forRoot()` registra a configuração principal, o `JusticaDialogModule` e o `JusticaAuthInterceptor`.

```ts
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {JusticaCoreModule} from '@justica/core';

@NgModule({
  imports: [
    HttpClientModule,
    JusticaCoreModule.forRoot({
      urlApi: '/api/',
      urlKeycloack: 'https://keycloak-dev.web.stj.jus.br',
      rotaLogin: '/login',
      chaveAccessToken: 'token',
      chaveRefreshToken: 'refresh_token',
      margemSegurancaRefreshTokenSegundos: 60
    })
  ]
})
export class AppModule {}
```

Configurações disponíveis:

| Campo                                 | Descrição                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `urlApi`                              | URL base da API da aplicação.                                            |
| `urlKeycloack`                        | URL base do Keycloak usada para montar `/protocol/openid-connect/token`. |
| `rotaLogin`                           | Rota usada pelo guard e por `JusticaAuthService.realizarLogout()`.       |
| `chaveAccessToken`                    | Chave do access token no `localStorage`. Padrão: `token`.                |
| `chaveRefreshToken`                   | Chave do refresh token no `localStorage`. Padrão: `refresh_token`.       |
| `margemSegurancaRefreshTokenSegundos` | Margem configurável para renovação preventiva.                           |

Também é possível registrar a configuração com o helper `provideJusticaCoreConfig()`:

```ts
import {NgModule} from '@angular/core';
import {JUSTICA_CORE_CONFIG, provideJusticaCoreConfig} from '@justica/core/tokens';

@NgModule({
  providers: [
    provideJusticaCoreConfig({
      rotaLogin: '/login'
    })
  ]
})
export class AppModule {}
```

## Tokens Públicos

Os tokens públicos podem ser importados por `@justica/core/tokens`:

| Token/constante                                      | Descrição                                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `JUSTICA_CORE_CONFIG`                                | `InjectionToken` da configuração principal.                                                         |
| `provideJusticaCoreConfig`                           | Helper de providers para registrar a configuração principal.                                        |
| `JUSTICA_CORE_CONFIG_PADRAO`                         | Valores padrão da configuração principal.                                                           |
| `JUSTICA_API_URL`                                    | URL base padrão da API.                                                                             |
| `JUSTICA_BASE_URL_KEYCLOACK`                         | URL base padrão do Keycloak.                                                                        |
| `JUSTICA_ACCESS_TOKEN_KEY`                           | Chave padrão do access token.                                                                       |
| `JUSTICA_REFRESH_TOKEN_KEY`                          | Chave padrão do refresh token.                                                                      |
| `JUSTICA_MARGEM_SEGURANCA_REFRESH_TOKEN_EM_SEGUNDOS` | Margem padrão para renovação preventiva.                                                            |
| `JUSTICA_INATIVIDADE_USUARIO_CONFIG`                 | `InjectionToken` da configuração de inatividade.                                                    |
| `JUSTICA_INATIVIDADE_USUARIO_CONFIG_PADRAO`          | Valores padrão de inatividade.                                                                      |
| `JUSTICA_WINDOW`                                     | Token para acesso injetável a `window`, `document`, `location`, `localStorage` e APIs relacionadas. |
| `JUSTICA_DIALOG_CONFIG`                              | Token interno do diálogo usado para injetar a configuração na instância aberta.                     |

## Autenticação e Sessão

A responsabilidade de sessão está dividida em serviços públicos:

| Service                       | Responsabilidade                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `JusticaAuthService`          | Executa logout via `realizarLogout()`, para os monitoramentos, limpa tokens e redireciona para `rotaLogin` ou `/login`.           |
| `JusticaSessaoMonitorService` | Monitora expiração dos tokens, sincroniza `expToken` e `expRefreshToken`, alerta sobre sessão expirando e tenta renovar a sessão. |
| `JusticaRefreshTokenService`  | Executa refresh token no endpoint do Keycloak, reaproveitando a mesma requisição quando houver chamadas simultâneas.              |
| `JusticaTokenStorageService`  | Lê, salva e remove `access_token` e `refresh_token` nas chaves configuradas.                                                      |
| `JusticaTokenUtilService`     | Decodifica JWT, calcula expiração, verifica token expirado e mantém cache do token decodificado.                                  |
| `JusticaUsuarioService`       | Expõe dados do usuário logado a partir do payload do access token.                                                                |

Para iniciar o monitoramento de expiração da sessão, use `JusticaSessaoMonitorService` no componente raiz:

```ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {JusticaSessaoMonitorService} from '@justica/core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(private readonly _justicaSessaoMonitorService: JusticaSessaoMonitorService) {}

  ngOnInit(): void {
    this._justicaSessaoMonitorService.iniciarMonitoramento();
  }

  ngOnDestroy(): void {
    this._justicaSessaoMonitorService.pararMonitoramento();
  }
}
```

Ao iniciar o monitoramento, a lib decodifica os tokens existentes e mantém no `localStorage` as chaves auxiliares:

| Chave             | Conteúdo                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `expToken`        | Data e hora de expiração do access token no formato `dd/MM/yyyy HH:mm:ss`.  |
| `expRefreshToken` | Data e hora de expiração do refresh token no formato `dd/MM/yyyy HH:mm:ss`. |

Para encerrar a sessão, use:

```ts
this._justicaAuthService.realizarLogout();
```

## Interceptor HTTP

`JusticaAuthInterceptor` é registrado por `JusticaCoreModule.forRoot()`.

Ele adiciona headers quando houver access token:

| Header          | Valor                                         |
| --------------- | --------------------------------------------- |
| `Authorization` | `Bearer <access_token>`                       |
| `ContentType`   | `application/json`                            |
| `X-XSRF-TOKEN`  | Valor do cookie `XSRF-TOKEN`, quando existir. |

Requisições cuja URL contém `/token` não recebem o token. Em respostas `401`, o interceptor tenta `JusticaRefreshTokenService.renovarToken()` e reexecuta a requisição original. Se o refresh falhar, executa `JusticaAuthService.realizarLogout()`.

## Usuário Logado

Os dados do usuário autenticado são extraídos exclusivamente do payload do access token. A lib não duplica dados do usuário em storage.

```ts
import {JusticaUsuarioService} from '@justica/core/services';

const usuario = this._justicaUsuarioService.obterUsuario();
const seqUsuario = this._justicaUsuarioService.obterSeqUsuario();
const seqLocal = this._justicaUsuarioService.obterSeqLocal();
const nomeUsuario = this._justicaUsuarioService.obterNomeUsuario();
const nomeLocal = this._justicaUsuarioService.obterNomeLocal();
```

Campos esperados no payload do token:

```ts
usuario: number | string;
local: number | string;
nome: string;
nomeLocal: string;
```

O retorno normalizado de `obterUsuario()` segue `JusticaUsuarioLogado`:

```ts
seqUsuario: number;
seqLocal: number;
nomeUsuario: string;
nomeLocal: string;
```

## Guarda de Rota

Use o guard para rotas que exigem tokens presentes:

```ts
import {JusticaAutenticadoGuard} from '@justica/core/guards';

const routes = [
  {
    path: 'processos',
    canActivate: [JusticaAutenticadoGuard],
    loadChildren: () => import('./processos/processos.module').then((m) => m.ProcessosModule)
  }
];
```

Quando não houver tokens, o guard redireciona para `rotaLogin` ou `/login`.

## Diálogo

O `JusticaDialogModule` é exportado por `JusticaCoreModule`, mas também pode ser importado diretamente por `@justica/core/components`.

```ts
import {NgModule} from '@angular/core';
import {JusticaDialogModule} from '@justica/core/components';

@NgModule({
  imports: [JusticaDialogModule]
})
export class ProcessosModule {}
```

Uso básico:

```ts
import {JusticaDialogService} from '@justica/core/components';

this._justicaDialogService.sucesso('Registro salvo', 'A operação foi realizada com sucesso.');
```

Métodos de conveniência:

| Método                         | Tipo       | Botões                              |
| ------------------------------ | ---------- | ----------------------------------- |
| `sucesso(titulo, mensagem?)`   | `success`  | Fecha automaticamente em `2000` ms. |
| `info(titulo, mensagem?)`      | `info`     | Exibe `OK`.                         |
| `warning(titulo, mensagem?)`   | `warning`  | Exibe `OK`.                         |
| `erro(titulo, mensagem?)`      | `error`    | Exibe `OK`.                         |
| `confirmar(titulo, mensagem?)` | `question` | Exibe `Confirmar` e `Cancelar`.     |

Configuração avançada:

```ts
this._justicaDialogService.abrir({
  tipo: 'warning',
  titulo: 'Atenção',
  mensagem: 'Revise os dados antes de continuar.',
  textoConfirmar: 'Continuar',
  textoCancelar: 'Voltar',
  exibirConfirmar: true,
  exibirCancelar: true,
  fecharAoClicarFora: false,
  fecharComEsc: true,
  largura: '36rem'
});
```

O diálogo pode receber componentes customizados para até três botões:

| Campo                      | Descrição                                            |
| -------------------------- | ---------------------------------------------------- |
| `componenteBotaoConfirmar` | Substitui o botão padrão de confirmar.               |
| `componenteBotaoCancelar`  | Substitui o botão padrão de cancelar.                |
| `componenteOutroBotao`     | Adiciona um terceiro botão definido pelo consumidor. |

## Monitoramento de Inatividade do Usuário

`JusticaInatividadeUsuarioService` monitora eventos de atividade do usuário e emite notificações de alerta, atividade e inatividade. O alerta visual usa `JusticaDialogService`.

Valores padrão:

| Campo                | Valor                                                   |
| -------------------- | ------------------------------------------------------- |
| `tempoLimiteMinutos` | `30`                                                    |
| `tempoAlertaMinutos` | `5`                                                     |
| `eventosMonitorados` | `mousemove`, `keydown`, `click`, `scroll`, `touchstart` |

Com o padrão, o diálogo abre aos 25 minutos de inatividade e conta os 5 minutos restantes até a expiração. Qualquer atividade reinicia o ciclo; se não houver tokens válidos, o serviço tenta renovar a sessão antes de reiniciar.

Para sobrescrever a configuração:

```ts
import {NgModule} from '@angular/core';
import {
  criarJusticaInatividadeUsuarioConfig,
  JUSTICA_INATIVIDADE_USUARIO_CONFIG
} from '@justica/core/tokens';

@NgModule({
  providers: [
    {
      provide: JUSTICA_INATIVIDADE_USUARIO_CONFIG,
      useValue: criarJusticaInatividadeUsuarioConfig({
        tempoLimiteMinutos: 45,
        tempoAlertaMinutos: 5,
        eventosMonitorados: ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
      })
    }
  ]
})
export class AppModule {}
```

No componente raiz:

```ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {JusticaAuthService, JusticaInatividadeUsuarioService} from '@justica/core/services';

export class AppComponent implements OnInit, OnDestroy {
  private readonly _subscription = new Subscription();
  tempoRestanteInatividade = '';

  constructor(
    private readonly _justicaAuthService: JusticaAuthService,
    private readonly _justicaInatividadeUsuarioService: JusticaInatividadeUsuarioService
  ) {}

  ngOnInit(): void {
    this._justicaInatividadeUsuarioService.iniciarMonitoramento();

    this._subscription.add(
      this._justicaInatividadeUsuarioService.usuarioInativo$.subscribe(() =>
        this._justicaAuthService.realizarLogout()
      )
    );

    this._subscription.add(
      this._justicaInatividadeUsuarioService.tempoRestanteMonitoramentoUsuario$.subscribe(
        (tempoRestante) => {
          this.tempoRestanteInatividade = tempoRestante;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._justicaInatividadeUsuarioService.pararMonitoramento();
  }
}
```

Fluxos públicos:

| Observable                           | Emissão                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `alertaInatividadeUsuario$`          | Segundos restantes durante o alerta.                                                    |
| `tempoRestanteMonitoramentoUsuario$` | Tempo total restante formatado como `mm:ss`.                                            |
| `usuarioAtivo$`                      | Emitido quando o usuário confirma continuidade ou atividade relevante reinicia o ciclo. |
| `usuarioInativo$`                    | Emitido quando o tempo limite é atingido ou a sessão não pode ser renovada.             |

## Pontos de Entrada

A API primária exporta tudo:

```ts
import {JusticaCoreModule, JusticaUsuarioService} from '@justica/core';
```

Também existem pontos de entrada secundários:

```ts
import {JusticaDialogModule, JusticaDialogService} from '@justica/core/components';
import {JusticaAutenticadoGuard} from '@justica/core/guards';
import {JusticaAuthInterceptor} from '@justica/core/interceptors';
import {JusticaCoreConfig, JusticaDialogConfig} from '@justica/core/models';
import {
  JusticaAuthService,
  JusticaInatividadeUsuarioService,
  JusticaSessaoMonitorService,
  JusticaUsuarioService
} from '@justica/core/services';
import {JUSTICA_CORE_CONFIG, JUSTICA_WINDOW} from '@justica/core/tokens';
```

## Desenvolvimento Local

Na raiz do workspace:

```bash
npm install
npm run build:justica-core
npm run lint
npm test -- justica-core --watch=false --browsers=ChromeHeadlessSemGpu
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
  components/           ponto de entrada secundário @justica/core/components
  guards/               ponto de entrada secundário @justica/core/guards
  interceptors/         ponto de entrada secundário @justica/core/interceptors
  models/               ponto de entrada secundário @justica/core/models
  services/             ponto de entrada secundário @justica/core/services
  tokens/               ponto de entrada secundário @justica/core/tokens
  utils/                ponto de entrada secundário @justica/core/utils
```

Não crie `index.ts` dentro de `src/lib`. Imports internos da lib devem apontar para arquivos específicos.
