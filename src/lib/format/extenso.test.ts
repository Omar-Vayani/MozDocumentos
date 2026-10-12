import { describe, expect, it } from 'vitest';
import { inteiroPorExtenso, numeroPorExtenso } from './extenso';

describe('inteiroPorExtenso', () => {
  it.each([
    [0, 'zero'],
    [1, 'um'],
    [14, 'catorze'],
    [16, 'dezasseis'],
    [17, 'dezassete'],
    [19, 'dezanove'],
    [20, 'vinte'],
    [21, 'vinte e um'],
    [99, 'noventa e nove'],
    [100, 'cem'],
    [101, 'cento e um'],
    [110, 'cento e dez'],
    [200, 'duzentos'],
    [555, 'quinhentos e cinquenta e cinco'],
    [999, 'novecentos e noventa e nove'],
    [1000, 'mil'],
    [1001, 'mil e um'],
    [1100, 'mil e cem'],
    [1200, 'mil e duzentos'],
    [1250, 'mil duzentos e cinquenta'],
    [2001, 'dois mil e um'],
    [15000, 'quinze mil'],
    [21345, 'vinte e um mil trezentos e quarenta e cinco'],
    [100000, 'cem mil'],
    [101000, 'cento e um mil'],
    [999999, 'novecentos e noventa e nove mil novecentos e noventa e nove'],
    [1000000, 'um milhão'],
    [1000001, 'um milhão e um'],
    [1500000, 'um milhão e quinhentos mil'],
    [2000000, 'dois milhões'],
    [2345678, 'dois milhões trezentos e quarenta e cinco mil seiscentos e setenta e oito'],
    [999999999, 'novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove'],
  ])('%i → %s', (n, s) => {
    expect(inteiroPorExtenso(n)).toBe(s);
  });

  it('rejeita valores fora do intervalo', () => {
    expect(() => inteiroPorExtenso(-1)).toThrow();
    expect(() => inteiroPorExtenso(1_000_000_000)).toThrow();
    expect(() => inteiroPorExtenso(1.5)).toThrow();
  });
});

describe('numeroPorExtenso (meticais)', () => {
  it.each([
    [0, 'zero meticais'],
    [1, 'um metical'],
    [2, 'dois meticais'],
    [0.01, 'um centavo'],
    [0.5, 'cinquenta centavos'],
    [1.5, 'um metical e cinquenta centavos'],
    [15000, 'quinze mil meticais'],
    [15000.5, 'quinze mil meticais e cinquenta centavos'],
    [8750.25, 'oito mil setecentos e cinquenta meticais e vinte e cinco centavos'],
    [1000000, 'um milhão de meticais'],
    [3000000, 'três milhões de meticais'],
    [1500000, 'um milhão e quinhentos mil meticais'],
    [1000000.99, 'um milhão de meticais e noventa e nove centavos'],
    [999999999.99, 'novecentos e noventa e nove milhões novecentos e noventa e nove mil novecentos e noventa e nove meticais e noventa e nove centavos'],
  ])('%f → %s', (n, s) => {
    expect(numeroPorExtenso(n)).toBe(s);
  });

  it('arredonda correctamente os centavos', () => {
    expect(numeroPorExtenso(0.1 + 0.2)).toBe('trinta centavos');
    expect(numeroPorExtenso(19.999)).toBe('vinte meticais');
  });

  it('rejeita valores fora do intervalo', () => {
    expect(() => numeroPorExtenso(-0.01)).toThrow();
    expect(() => numeroPorExtenso(1_000_000_000)).toThrow();
    expect(() => numeroPorExtenso(Number.NaN)).toThrow();
  });
});
