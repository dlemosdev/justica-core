import { JusticaJwtService } from './justica-jwt.service';

describe('JusticaJwtService', () => {
  let service: JusticaJwtService;

  beforeEach(() => {
    service = new JusticaJwtService();
  });

  it('deve decodificar payload JWT em base64 url', () => {
    const token = criarToken({
      seqUsuario: 10,
      seqLocal: 20,
      nomeUsuario: 'Usuario Teste',
      nomeLocal: 'Local Teste'
    });

    const payload = service.obterPayload(token);

    expect(payload).toEqual(jasmine.objectContaining({
      seqUsuario: 10,
      seqLocal: 20,
      nomeUsuario: 'Usuario Teste',
      nomeLocal: 'Local Teste'
    }));
  });

  it('deve reutilizar payload em cache para o mesmo token', () => {
    const token = criarToken({ sub: '123' });

    const primeiroPayload = service.obterPayload(token);
    const segundoPayload = service.obterPayload(token);

    expect(segundoPayload).toBe(primeiroPayload);
  });

  it('deve considerar token expirado quando exp estiver no passado', () => {
    const token = criarToken({
      exp: Math.floor(Date.now() / 1000) - 1
    });

    expect(service.estaExpirado(token)).toBeTrue();
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
