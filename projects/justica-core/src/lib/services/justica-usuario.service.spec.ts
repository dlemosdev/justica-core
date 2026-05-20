import { TestBed } from '@angular/core/testing';

import { JusticaJwtService } from './justica-jwt.service';
import { JusticaStorageTokenService } from './justica-storage-token.service';
import { JusticaUsuarioService } from './justica-usuario.service';
import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';

describe('JusticaUsuarioService', () => {
  let service: JusticaUsuarioService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        JusticaJwtService,
        JusticaStorageTokenService,
        JusticaUsuarioService,
        {
          provide: JUSTICA_CORE_CONFIG,
          useValue: {
            chaveAccessToken: 'justica.accessToken',
            chaveRefreshToken: 'justica.refreshToken'
          }
        }
      ]
    });

    service = TestBed.inject(JusticaUsuarioService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve extrair usuario logado do access token', () => {
    localStorage.setItem('justica.accessToken', criarToken({
      seqUsuario: 10,
      seqLocal: 20,
      nomeUsuario: 'Usuario Teste',
      nomeLocal: 'Local Teste'
    }));

    expect(service.obterUsuario()).toEqual({
      seqUsuario: 10,
      seqLocal: 20,
      nomeUsuario: 'Usuario Teste',
      nomeLocal: 'Local Teste'
    });
  });

  it('deve limpar cache quando solicitado', () => {
    localStorage.setItem('justica.accessToken', criarToken({
      seqUsuario: 10,
      seqLocal: 20,
      nomeUsuario: 'Usuario Teste',
      nomeLocal: 'Local Teste'
    }));

    expect(service.obterSeqUsuario()).toBe(10);

    service.limparCache();
    localStorage.setItem('justica.accessToken', criarToken({
      seqUsuario: 30,
      seqLocal: 40,
      nomeUsuario: 'Outro Usuario',
      nomeLocal: 'Outro Local'
    }));

    expect(service.obterSeqUsuario()).toBe(30);
  });
});

function criarToken(payload: object): string {
  return [
    codificarBase64Url({ alg: 'none', typ: 'JWT' }),
    codificarBase64Url(payload),
    ''
  ].join('.');
}

function codificarBase64Url(valor: object): string {
  return btoa(JSON.stringify(valor))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
