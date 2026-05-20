export class StringUtils {
  private static readonly PALAVRAS_MINUSCULAS_PT_BR = new Set([
    'a',
    'as',
    'ao',
    'aos',
    'da',
    'das',
    'de',
    'do',
    'dos',
    'e',
    'em',
    'na',
    'nas',
    'no',
    'nos',
    'o',
    'os',
    'ou',
    'por',
    'pra',
    'pro',
    'para',
    'com',
  ]);

  static capitalizar(texto: string): string {
    const textoNormalizado = texto?.trim();

    if (!textoNormalizado) {
      return '';
    }

    const palavras = textoNormalizado
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((palavra) => palavra.toLocaleLowerCase('pt-BR'));

    return palavras
      .map((palavra, indice) => {
        const primeiraPalavra = indice === 0;
        const ultimaPalavra = indice === palavras.length - 1;
        const devePermanecerMinuscula =
          !primeiraPalavra &&
          !ultimaPalavra &&
          StringUtils.PALAVRAS_MINUSCULAS_PT_BR.has(palavra);

        if (devePermanecerMinuscula) {
          return palavra;
        }

        return StringUtils.capitalizarPalavra(palavra);
      })
      .join(' ');
  }

  private static capitalizarPalavra(palavra: string): string {
    if (!palavra) {
      return palavra;
    }

    return palavra.charAt(0).toLocaleUpperCase('pt-BR') + palavra.slice(1).toLocaleLowerCase('pt-BR');
  }
}
