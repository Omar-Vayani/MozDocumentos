// Números por extenso em português (uso moçambicano), para valores em meticais.
// Suporta valores de 0 a 999 999 999,99.

const UNIDADES = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove',
];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
];

export const MAX_EXTENSO = 999_999_999.99;

/** 0–999 por extenso. */
function ate999(n: number): string {
  if (n < 20) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d];
  }
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${CENTENAS[c]} e ${ate999(r)}` : CENTENAS[c];
}

/** Inteiro de 0 a 999 999 999 por extenso (masculino). */
export function inteiroPorExtenso(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) {
    throw new RangeError(`Valor fora do intervalo suportado: ${n}`);
  }
  if (n === 0) return 'zero';

  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const grupos: { valor: number; texto: string }[] = [];
  if (milhoes) grupos.push({ valor: milhoes, texto: milhoes === 1 ? 'um milhão' : `${ate999(milhoes)} milhões` });
  if (milhares) grupos.push({ valor: milhares, texto: milhares === 1 ? 'mil' : `${ate999(milhares)} mil` });
  if (resto) grupos.push({ valor: resto, texto: ate999(resto) });

  // Regra da conjunção: o último grupo leva "e" quando é inferior a 100
  // ou é uma centena redonda (ex.: "mil e cem", "dois mil e um", "um milhão e quinhentos mil").
  return grupos
    .map((g, i) => {
      if (i === 0) return g.texto;
      const ultimo = i === grupos.length - 1;
      return ultimo && (g.valor < 100 || g.valor % 100 === 0) ? `e ${g.texto}` : g.texto;
    })
    .join(' ');
}

/**
 * Valor monetário em meticais por extenso.
 * 15000 → "quinze mil meticais"; 1,5 → "um metical e cinquenta centavos";
 * 2000000 → "dois milhões de meticais".
 */
export function numeroPorExtenso(valor: number): string {
  if (!Number.isFinite(valor) || valor < 0 || valor > MAX_EXTENSO) {
    throw new RangeError(`Valor fora do intervalo suportado: ${valor}`);
  }
  const totalCentavos = Math.round(valor * 100);
  const meticais = Math.floor(totalCentavos / 100);
  const centavos = totalCentavos % 100;

  const partes: string[] = [];
  if (meticais > 0) {
    const texto = inteiroPorExtenso(meticais);
    const de = meticais >= 1_000_000 && meticais % 1_000_000 === 0 ? ' de' : '';
    partes.push(`${texto}${de} ${meticais === 1 ? 'metical' : 'meticais'}`);
  }
  if (centavos > 0) {
    partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  }
  if (partes.length === 0) return 'zero meticais';
  return partes.join(' e ');
}
