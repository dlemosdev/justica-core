import {HTTP_INTERCEPTORS, HttpClient} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';

import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {
  JusticaLogErroInterceptor,
  provideJusticaLogErroInterceptor
} from './justica-log-erro.interceptor';

describe('JusticaLogErroInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: Storage;

  function configurarTeste(config?: {
    modulo?: string;
    numErros?: number;
    ativo?: boolean;
    ignoraStatus?: number[];
  }): void {
    storage = localStorage;
    storage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideJusticaLogErroInterceptor({
          modulo: 'justica-core',
          ...config
        }),
        {
          provide: JUSTICA_WINDOW,
          useValue: {
            localStorage: storage
          } as Partial<JusticaWindow>
        }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
    storage.clear();
    TestBed.resetTestingModule();
  });

  it('deve registrar interceptor pelo provider opcional', () => {
    configurarTeste();

    const interceptors = TestBed.inject(HTTP_INTERCEPTORS);

    expect(interceptors.some((interceptor) => interceptor instanceof JusticaLogErroInterceptor)).toBeTrue();
  });

  it('deve salvar erro http no localStorage usando modulo configurado', fakeAsync(() => {
    configurarTeste();

    http.get('/api/processos').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/processos').flush(
      {
        status: 500,
        title: 'Erro interno'
      },
      {
        status: 500,
        statusText: 'Server Error'
      }
    );
    tick();

    const erros = JSON.parse(storage.getItem('erros') || '[]');
    expect(erros.length).toBe(1);
    expect(erros[0].modulo).toBe('justica-core');
    expect(erros[0].erro.status).toBe(500);
    expect(erros[0].erro.title).toBe('Erro interno');
  }));

  it('deve respeitar limite maximo de erros', fakeAsync(() => {
    configurarTeste({
      numErros: 2
    });
    storage.setItem(
      'erros',
      JSON.stringify([
        {
          modulo: 'justica-core',
          data: new Date(),
          erro: {status: 400}
        },
        {
          modulo: 'justica-core',
          data: new Date(),
          erro: {status: 401}
        }
      ])
    );

    http.get('/api/processos').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/processos').flush(
      {
        status: 500,
        title: 'Erro interno'
      },
      {
        status: 500,
        statusText: 'Server Error'
      }
    );
    tick();

    const erros = JSON.parse(storage.getItem('erros') || '[]');
    expect(erros.length).toBe(2);
    expect(erros[0].erro.status).toBe(500);
    expect(erros[1].erro.status).toBe(400);
  }));

  it('deve ignorar status configurado', fakeAsync(() => {
    configurarTeste({
      ignoraStatus: [404]
    });

    http.get('/api/processos/1').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/processos/1').flush(
      {
        status: 404,
        title: 'Nao encontrado'
      },
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
    tick();

    expect(storage.getItem('erros')).toBeNull();
  }));

  it('nao deve salvar erro quando configuracao estiver inativa', () => {
    configurarTeste({
      ativo: false
    });

    http.get('/api/processos').subscribe({
      error: () => undefined
    });

    httpMock.expectOne('/api/processos').flush(
      {
        status: 500,
        title: 'Erro interno'
      },
      {
        status: 500,
        statusText: 'Server Error'
      }
    );

    expect(storage.getItem('erros')).toBeNull();
  });

  it('deve salvar erro de conexao status zero com dados normalizados', fakeAsync(() => {
    configurarTeste();

    http.get('/api/processos').subscribe({
      error: () => undefined
    });

    const erro = new ErrorEvent('error');
    httpMock.expectOne('/api/processos').error(erro);
    tick();

    const erros = JSON.parse(storage.getItem('erros') || '[]');
    expect(erros.length).toBe(1);
    expect(erros[0].erro.status).toBe(0);
    expect(erros[0].erro.path).toBe('/api/processos');
    expect(erros[0].erro.exceptionName).toBe('HttpErrorResponse');
  }));
});
