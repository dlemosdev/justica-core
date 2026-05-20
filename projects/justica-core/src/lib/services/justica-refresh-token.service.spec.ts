import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { JUSTICA_CORE_CONFIG } from '../tokens/justica-core-config.token';
import { JusticaRefreshTokenService } from './justica-refresh-token.service';

describe('JusticaRefreshTokenService', () => {
  let service: JusticaRefreshTokenService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('justica.refreshToken', 'refresh-antigo');

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        JusticaRefreshTokenService,
        {
          provide: JUSTICA_CORE_CONFIG,
          useValue: {
            chaveAccessToken: 'justica.accessToken',
            chaveRefreshToken: 'justica.refreshToken',
            urlRefreshToken: '/api/auth/refresh'
          }
        }
      ]
    });

    service = TestBed.inject(JusticaRefreshTokenService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve controlar refresh simultaneo com uma unica requisicao HTTP', () => {
    let primeiroToken = '';
    let segundoToken = '';

    service.renovarTokenControlado()
      .subscribe(token => primeiroToken = token);
    service.renovarTokenControlado()
      .subscribe(token => segundoToken = token);

    const requisicao = httpMock.expectOne('/api/auth/refresh');
    expect(requisicao.request.body).toEqual({
      refreshToken: 'refresh-antigo'
    });

    requisicao.flush({
      accessToken: 'access-novo',
      refreshToken: 'refresh-novo'
    });

    expect(primeiroToken).toBe('access-novo');
    expect(segundoToken).toBe('access-novo');
    expect(localStorage.getItem('justica.accessToken')).toBe('access-novo');
    expect(localStorage.getItem('justica.refreshToken')).toBe('refresh-novo');
  });

  it('deve limpar sessao quando o refresh falhar', () => {
    localStorage.setItem('justica.accessToken', 'access-antigo');
    let erroRecebido: unknown;

    service.renovarTokenControlado()
      .subscribe({
        error: erro => erroRecebido = erro
      });

    httpMock.expectOne('/api/auth/refresh').flush({}, {
      status: 401,
      statusText: 'Unauthorized'
    });

    expect(erroRecebido).toBeTruthy();
    expect(localStorage.getItem('justica.accessToken')).toBeNull();
    expect(localStorage.getItem('justica.refreshToken')).toBeNull();
  });
});
