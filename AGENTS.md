# AGENTS.md

Instruções para agentes que trabalharem neste repositório.

## Context7

Use Context7 MCP para buscar documentação atual sempre que a tarefa envolver uma biblioteca, framework, SDK, API, ferramenta de CLI ou serviço de cloud. Isto inclui Angular, RxJS, ng-packagr, Karma, Jasmine, ESLint, Docker, npm e ferramentas relacionadas.

Fluxo obrigatório:

1. Chame `resolve-library-id` com o nome da biblioteca e a pergunta do usuário, exceto quando o usuário informar um ID exato no formato `/org/projeto`.
2. Escolha o melhor resultado por nome, descrição, reputação, quantidade de exemplos e pontuação.
3. Chame `query-docs` com o ID escolhido e a pergunta completa.
4. Responda ou implemente usando a documentação retornada.

Não use Context7 para refatoração pura, scripts do zero, debug de regra de negócio, code review ou conceitos gerais de programação.

## Skill Angular

Use a skill `angular-developer`, baseada nas Agent Skills oficiais do Angular, em toda execução que envolva Angular. Isso inclui criação ou alteração de componentes, services, módulos, guards, interceptors, tokens, DI, testes, RxJS integrado ao Angular, formulários, rotas, estilos, CLI, build ou qualquer orientação arquitetural do framework.

Ao usar a skill:

1. Leia as instruções da skill `angular-developer` antes de orientar ou alterar código Angular.
2. Analise a versão real do projeto antes de aplicar recomendações. Neste workspace, o alvo é Angular 11, TypeScript 4.1 e RxJS 6.
3. Aplique somente padrões compatíveis com Angular 11. Recomendações modernas da skill, como Signals, `linkedSignal`, `resource` ou APIs recentes, só devem ser citadas como contexto; não devem ser implementadas neste projeto.
4. Continue usando Context7 quando a tarefa pedir documentação atual de Angular ou de qualquer biblioteca relacionada.
5. Ao finalizar mudanças de código Angular, tente validar com `npm run build:justica-core` e, quando houver teste aplicável, com `ChromeHeadlessSemGpu`.

## Visão Geral

Este workspace contém a biblioteca Angular `@justica/core`, voltada para padronizar autenticação, tokens, refresh de sessão, dados do usuário logado, guards, interceptors, monitoramento de inatividade e componentes compartilhados.

O projeto é uma biblioteca Angular, não uma aplicação. Não implemente telas ou fluxos de login dentro da lib. O fluxo esperado é que uma aplicação externa autentique o usuário, grave `access_token` e `refresh_token` no `localStorage` e a biblioteca consuma esses tokens.

Principais versões:

- Angular `~11.2.14`
- Angular CLI `~11.2.19`
- TypeScript `~4.1.5`
- RxJS `~6.6.0`
- ng-packagr `^11.0.0`
- Jasmine/Karma para testes unitários
- ESLint com `angular-eslint`

Mantenha toda mudança compatível com Angular 11 e TypeScript 4.1. Não use APIs modernas do Angular que não existam nessa versão.

## Estrutura

Estrutura principal:

```txt
projects/justica-core/
  src/lib/              implementação interna da biblioteca
  src/public-api.ts     API primária do pacote @justica/core
  components/           secondary entry point @justica/core/components
  guards/               secondary entry point @justica/core/guards
  interceptors/         secondary entry point @justica/core/interceptors
  models/               secondary entry point @justica/core/models
  services/             secondary entry point @justica/core/services
  tokens/               secondary entry point @justica/core/tokens
  utils/                secondary entry point @justica/core/utils
```

Não crie barrels internos dentro de `projects/justica-core/src/lib`. Imports internos devem apontar para arquivos específicos.

Correto:

```ts
import {JusticaCoreConfig} from '../models/justica-core-config';
```

Evite:

```ts
import {JusticaCoreConfig} from '../models';
```

## Entry Points Públicos

Todo símbolo público deve ser exportado em `projects/justica-core/src/public-api.ts`.

Quando o símbolo pertencer a uma área com secondary entry point, também atualize o respectivo `public-api.ts`:

- Componentes: `projects/justica-core/components/public-api.ts`
- Guards: `projects/justica-core/guards/public-api.ts`
- Interceptors: `projects/justica-core/interceptors/public-api.ts`
- Models: `projects/justica-core/models/public-api.ts`
- Services: `projects/justica-core/services/public-api.ts`
- Tokens: `projects/justica-core/tokens/public-api.ts`
- Utils: `projects/justica-core/utils/public-api.ts`

Os secondary entry points devem reexportar a partir de `@justica/core`, seguindo o padrão existente.

## Padrões de Código

- Use nomes em PT-BR para classes, métodos, propriedades e arquivos da lib.
- Prefixe classes públicas com `Justica` quando forem parte da API da biblioteca.
- Use `@Injectable({ providedIn: 'root' })` para services singleton.
- Injete dependências por construtor usando `private readonly`.
- Propriedades privadas devem iniciar com `_`.
- Marque propriedades como `readonly` quando não forem reatribuídas.
- Use ponto e vírgula e aspas simples.
- Evite `any`; quando inevitável, mantenha o escopo pequeno.
- Não use non-null assertion (`!`).
- Não use `console`, exceto `console.warn` e `console.error`.
- Mantenha linhas em até 140 caracteres quando possível.
- Não introduza estado `static` em services de autenticação/sessão.
- Evite comentários óbvios; comente apenas regras não triviais ou decisões de domínio.

O projeto usa `.editorconfig` e Prettier:

- indentação com 2 espaços;
- `charset = utf-8`;
- newline final;
- sem trailing whitespace;
- Prettier com `printWidth: 100`, `singleQuote: true`, `semi: true`, `trailingComma: none` e `endOfLine: lf`.

## Angular

- Component selectors devem usar prefixo `justica` e `kebab-case`.
- Directive selectors devem usar prefixo `justica` e `camelCase`.
- Siga o estilo Angular 11: classes com decorators, DI por construtor e `ModuleWithProviders<Modulo>` em métodos `forRoot`.
- `JusticaCoreModule.forRoot()` é o ponto de configuração principal da lib.
- Registre interceptors com `HTTP_INTERCEPTORS` e `multi: true`.
- Ao criar módulos visuais públicos, exporte o módulo e mantenha imports mínimos.
- Componentes dinâmicos de diálogo devem continuar compatíveis com `ComponentFactoryResolver`, pois o projeto alvo é Angular 11.

## Configuração e Tokens

Configurações compartilhadas devem ficar em `models` como interfaces, constantes padrão e funções `criar...Config`.

Tokens Angular devem ficar em `src/lib/tokens` e usar `InjectionToken`. Quando houver valor padrão global, use `providedIn: 'root'` e `factory`.

Padrão:

```ts
export const JUSTICA_ALGUM_TOKEN = new InjectionToken<Tipo>('JUSTICA_ALGUM_TOKEN', {
  providedIn: 'root',
  factory: criarValorPadrao
});
```

Para configuração principal, prefira `provideJusticaCoreConfig(config)` dentro de `JusticaCoreModule.forRoot()` ou em providers explícitos.

Para APIs globais do navegador, encapsule o acesso em tokens para facilitar testes unitários. Use `JUSTICA_WINDOW` em vez de acessar diretamente `window`, `document`, `location`, `localStorage`, `sessionStorage`, `history` ou APIs similares quando o acesso puder ser isolado por DI.

## Autenticação, Sessão e Tokens

- A lib não realiza login.
- A fonte oficial de dados do usuário é o payload do access token.
- Não duplique dados do usuário em `localStorage`.
- `JusticaAuthService` é responsável pelo logout público via `realizarLogout()`: para monitoramentos, limpa tokens e redireciona para `rotaLogin` ou `/login`.
- `JusticaSessaoMonitorService` é responsável pelo monitoramento de expiração dos tokens, sincronização das chaves informativas `expToken` e `expRefreshToken`, alertas de sessão e renovação quando aplicável.
- `JusticaInatividadeUsuarioService` é responsável por monitorar eventos do usuário, exibir alerta de inatividade via `JusticaDialogService`, emitir `usuarioAtivo$`/`usuarioInativo$` e tentar renovar sessão antes de reiniciar o ciclo quando necessário.
- Não recrie um `JusticaSessaoService` separado com semântica sobreposta; preserve a divisão atual entre auth, monitoramento de sessão e inatividade.
- `JusticaTokenUtilService` deve permanecer focado em decodificar JWT, calcular expiração, verificar token expirado e limpar cache. Não grave diretamente no `localStorage` nesse service.
- `JusticaTokenStorageService` deve concentrar leitura, escrita e remoção de `access_token` e `refresh_token` nas chaves configuradas.
- Limpe caches de JWT e usuário quando tokens forem alterados ou removidos.
- Refresh token deve evitar múltiplas chamadas simultâneas. O padrão atual usa uma observable compartilhada com `shareReplay(1)` e libera o estado em `finalize`.
- Falhas de refresh devem limpar sessão quando aplicável.
- Guards devem bloquear rotas sem tokens e usar a configuração pública da lib.
- Interceptors devem adicionar `Authorization: Bearer` apenas quando houver token e devem ignorar requisições de `/token`.
- Em `401`, o interceptor deve tentar refresh, reexecutar a requisição original e chamar `JusticaAuthService.realizarLogout()` se a renovação falhar.

## Usuário Logado

- `JusticaUsuarioService` deve derivar `JusticaUsuarioLogado` do access token atual.
- O payload esperado usa os campos `usuario`, `local`, `nome` e `nomeLocal`.
- O retorno público normalizado usa `seqUsuario`, `seqLocal`, `nomeUsuario` e `nomeLocal`.
- Mantenha cache por token e limpe o cache quando o token mudar, sumir ou for inválido.

## Diálogo

- Componentes compartilhados devem ficar em `src/lib/components`.
- O diálogo padrão vive em `src/lib/components/justica-dialog`.
- Mantenha `JusticaDialogModule`, `JusticaDialogComponent`, `JusticaDialogRef`, `JusticaDialogConfig` e `JusticaDialogService` exportados pelos entry points aplicáveis.
- Não crie dependências visuais pesadas sem necessidade.
- APIs de diálogo devem favorecer configurações tipadas e retornos via `JusticaDialogRef`.
- `JusticaDialogService.abrir()` deve criar instâncias dinâmicas, injetar `JUSTICA_DIALOG_CONFIG`, anexar o componente ao `ApplicationRef` e remover o elemento ao fechar.
- Métodos de conveniência atuais: `sucesso`, `info`, `warning`, `erro` e `confirmar`.
- O diálogo suporta até três botões: confirmar, cancelar e outro botão customizado.

## Inatividade do Usuário

- Configuração deve usar `JusticaInatividadeUsuarioConfig`, `JUSTICA_INATIVIDADE_USUARIO_CONFIG` e `criarJusticaInatividadeUsuarioConfig`.
- Padrões atuais: `tempoLimiteMinutos = 30`, `tempoAlertaMinutos = 5`, eventos `mousemove`, `keydown`, `click`, `scroll` e `touchstart`.
- Valide configurações inválidas: tempos maiores que zero, alerta menor que limite e ao menos um evento monitorado.
- Exponha fluxos públicos como `Observable`: `alertaInatividadeUsuario$`, `tempoRestanteMonitoramentoUsuario$`, `usuarioAtivo$` e `usuarioInativo$`.
- Cancele subscriptions criadas manualmente em `pararMonitoramento()` e antes de reiniciar ciclos.

## RxJS

- Use RxJS 6 e imports compatíveis.
- Exponha fluxos públicos como `Observable`.
- Mantenha `Subject`, `BehaviorSubject` e `ReplaySubject` privados.
- Nomeie streams com sufixo `$`.
- Cancele `Subscription` criada manualmente em métodos de parada ou `ngOnDestroy`.
- Para controle de concorrência de refresh, mantenha o padrão com observable compartilhada, `catchError`, `finalize`, `tap` e `shareReplay`.

## Testes

- Specs ficam ao lado do arquivo testado com sufixo `.spec.ts`.
- Use Jasmine, Karma e `TestBed`.
- Para dependências globais ou configurações, sobrescreva providers no `TestBed`, especialmente `JUSTICA_WINDOW`, `JUSTICA_CORE_CONFIG` e `JUSTICA_INATIVIDADE_USUARIO_CONFIG`.
- Prefira mocks pequenos e tipados.
- Ao testar HTTP, use `HttpClientTestingModule` e `HttpTestingController`.
- Ao testar timers ou RxJS temporal, use utilitários do Angular/Jasmine compatíveis com Angular 11.

Comandos úteis:

```bash
npm run build:justica-core
npm run lint
npm test -- justica-core --watch=false --browsers=ChromeHeadlessSemGpu
```

Para rodar um spec isolado:

```bash
npm test -- justica-core --watch=false --browsers=ChromeHeadlessSemGpu --include=**/arquivo.spec.ts
```

O launcher `ChromeHeadlessSemGpu` existe no Karma e deve ser preferido em ambientes onde `ChromeHeadless` falha por GPU/sandbox.

## Build, Pacote e Publicação

- Build de produção: `npm run build:justica-core`
- Build em watch: `npm run watch:justica-core`
- Gerar pacote local: `npm run pack:ui`
- Subir Verdaccio local: `npm run verdaccio:up`
- Publicar localmente: `npm run publish:local`
- Publicar snapshot: `npm run publish:snapshot`
- Publicar release: `npm run publish:release`

Não publique pacotes sem pedido explícito do usuário.

## Git e Mudanças Existentes

- Antes de editar, confira o contexto e preserve alterações existentes.
- Não reverta arquivos modificados por outra pessoa/agente sem pedido explícito.
- Evite refatorações amplas quando a tarefa pedir uma mudança pontual.
- Se tocar em arquivos que já estavam modificados, edite apenas o necessário.
- Use commits convencionais se o usuário pedir commit; o projeto usa `@commitlint/config-conventional`.

## Validação Antes de Entregar

Sempre que a mudança envolver TypeScript da lib, tente rodar:

1. `npm run build:justica-core`
2. testes relevantes com `ChromeHeadlessSemGpu`
3. `npm run lint` quando a alteração for maior ou tocar padrões de estilo

Se a validação falhar por problema preexistente ou ambiente, reporte o comando, o motivo e o escopo afetado. Não esconda falhas.
