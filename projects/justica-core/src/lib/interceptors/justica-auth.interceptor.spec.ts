import {HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {JUSTICA_CORE_CONFIG} from '../tokens/justica-core-config.token';
import {JusticaAuthInterceptor} from './justica-auth.interceptor';

describe('JusticaAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('justica.accessToken', 'access-antigo');
    localStorage.setItem('justica.refreshToken', 'refresh-antigo');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: JUSTICA_CORE_CONFIG,
          useValue: {
            chaveAccessToken: 'justica.accessToken',
            chaveRefreshToken: 'justica.refreshToken',
            urlRefreshToken: '/api/auth/refresh'
          }
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JusticaAuthInterceptor,
          multi: true
        }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve adicionar access token no header Authorization', () => {
    http.get('/api/processos').subscribe();

    const requisicao = httpMock.expectOne('/api/processos');
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer access-antigo');
    requisicao.flush({});
  });

  it('deve renovar token em 401 e repetir a requisicao original', () => {
    http.get('/api/processos').subscribe();

    const primeiraRequisicao = httpMock.expectOne('/api/processos');
    primeiraRequisicao.flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    const refresh = httpMock.expectOne('/api/auth/refresh');
    expect(refresh.request.headers.has('Authorization')).toBeFalse();
    refresh.flush({
      accessToken: 'access-novo',
      refreshToken: 'refresh-novo'
    });

    const segundaRequisicao = httpMock.expectOne('/api/processos');
    expect(segundaRequisicao.request.headers.get('Authorization')).toBe('Bearer access-novo');
    segundaRequisicao.flush({});
  });

  it('deve limpar sessao quando refresh do 401 falhar', () => {
    let erroRecebido: HttpErrorResponse | undefined;

    http.get('/api/processos').subscribe({
      error: (erro) => (erroRecebido = erro)
    });

    httpMock.expectOne('/api/processos').flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );
    httpMock.expectOne('/api/auth/refresh').flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    expect(erroRecebido).toBeTruthy();
    expect(localStorage.getItem('justica.accessToken')).toBeNull();
    expect(localStorage.getItem('justica.refreshToken')).toBeNull();
  });
});
