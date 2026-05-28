import {TestBed} from '@angular/core/testing';

import {JUSTICA_WINDOW, JusticaWindow} from '../tokens/justica-window.token';
import {JusticaLogErroService} from './justica-log-erro.service';

interface JusticaHtmlAnchorElementTeste {
  download: string;
  href: string;
  click: jasmine.Spy;
  setAttribute: jasmine.Spy;
}

interface JusticaDocumentBodyTeste {
  appendChild: jasmine.Spy;
  removeChild: jasmine.Spy;
}

describe('JusticaLogErroService', () => {
  let service: JusticaLogErroService;
  let storage: Storage;
  let anchor: JusticaHtmlAnchorElementTeste;
  let body: JusticaDocumentBodyTeste;

  beforeEach(() => {
    storage = localStorage;
    storage.clear();
    anchor = {
      download: '',
      href: '',
      click: jasmine.createSpy('click'),
      setAttribute: jasmine.createSpy('setAttribute').and.callFake((nome: string, valor: string) => {
        if (nome === 'href') {
          anchor.href = valor;
        }
      })
    };
    body = {
      appendChild: jasmine.createSpy('appendChild'),
      removeChild: jasmine.createSpy('removeChild')
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: JUSTICA_WINDOW,
          useValue: {
            localStorage: storage,
            document: {
              cookie: '',
              body,
              createElement: jasmine.createSpy('createElement').and.returnValue(anchor)
            }
          } as Partial<JusticaWindow>
        }
      ]
    });

    service = TestBed.inject(JusticaLogErroService);
  });

  afterEach(() => {
    storage.clear();
  });

  it('deve listar erros salvos no localStorage', () => {
    storage.setItem(
      'erros',
      JSON.stringify([
        {
          modulo: 'modulo',
          data: '2026-05-28T10:00:00.000Z',
          erro: {
            status: 500,
            title: 'Erro interno'
          }
        }
      ])
    );

    const logs = service.listarErros();

    expect(logs.length).toBe(1);
    expect(logs[0].modulo).toBe('modulo');
    expect(logs[0].data instanceof Date).toBeTrue();
  });

  it('deve normalizar erros salvos como objetos json simples', () => {
    storage.setItem(
      'erros',
      JSON.stringify([
        {
          modulo: 'Justica',
          data: '2026-05-28T14:15:14.635Z',
          erro: {
            error: 'invalid_grant',
            error_description: 'Token is not active'
          }
        }
      ])
    );

    const logs = service.listarErros();

    expect(logs.length).toBe(1);
    expect(logs[0].modulo).toBe('Justica');
    expect(logs[0].data instanceof Date).toBeTrue();
    expect(logs[0].erro).toEqual(
      jasmine.objectContaining({
        error: 'invalid_grant',
        error_description: 'Token is not active'
      })
    );
  });

  it('deve retornar lista vazia quando storage estiver invalido', () => {
    storage.setItem('erros', '{');

    expect(service.listarErros()).toEqual([]);
  });

  it('deve limpar erros salvos', () => {
    storage.setItem('erros', '[]');

    service.limparErros();

    expect(storage.getItem('erros')).toBeNull();
  });

  it('deve montar html escapando dados do erro', () => {
    const html = service.montarHtml([
      {
        modulo: '<modulo>',
        data: new Date('2026-05-28T10:00:00.000Z'),
        erro: {
          status: 500,
          title: '<script>alert(1)</script>',
          detail: 'Falha'
        }
      }
    ]);

    expect(html).toContain('&lt;modulo&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Falha');
  });

  it('deve montar html com quebra de linha para textos longos', () => {
    const html = service.montarHtml([]);

    expect(html).toContain('overflow-wrap: anywhere');
    expect(html).toContain('.json { color: grey; margin: 10px 0; white-space: pre-wrap;');
  });

  it('deve montar html apenas com campos preenchidos do erro', () => {
    const html = service.montarHtml([
      {
        modulo: 'Chancela Web',
        data: new Date('2026-05-28T18:06:38.056Z'),
        erro: {
          status: 500,
          title: '',
          message: 'Could not open JPA EntityManager',
          path: '/api/seguranca/locais/4',
          error: 'Internal Server Error',
          parametrosExtras: undefined
        }
      },
      {
        modulo: 'Chancela Web',
        data: new Date('2026-05-28T18:05:52.812Z'),
        erro: {
          status: 403,
          title: 'Forbidden',
          parametrosExtras: {
            parametroEnviados: {}
          }
        }
      }
    ]);

    expect(html).toContain('Status:</label> 500');
    expect(html).toContain('Detalhe:</label> Could not open JPA EntityManager');
    expect(html).toContain('URL:</label> /api/seguranca/locais/4');
    expect(html).toContain('Erro:</label> Internal Server Error');
    expect(html).not.toContain('Status Http:</label> </div>');
    expect(html).not.toContain('Titulo:</label> </div>');
    expect(html).not.toContain('Parametros enviados:</label> </div>');
    expect(html).not.toContain('Parametros enviados:</label> &quot;&quot;');
    expect(html).toContain('Titulo:</label> Forbidden');
    expect(html).toContain('Parametros enviados:</label> {&quot;parametroEnviados&quot;:{}}');
  });

  it('deve exportar html em arquivo baixavel', () => {
    service.exportarHtml('erros.html', [
      {
        modulo: 'modulo',
        data: new Date('2026-05-28T10:00:00.000Z'),
        erro: {
          status: 500
        }
      }
    ]);

    expect(anchor.setAttribute).toHaveBeenCalledWith(
      'href',
      jasmine.stringMatching(/^data:text\/html;charset=utf-8,/)
    );
    expect(anchor.download).toBe('erros.html');
    expect(body.appendChild).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalled();
    expect(body.removeChild).toHaveBeenCalledWith(anchor);
  });
});
