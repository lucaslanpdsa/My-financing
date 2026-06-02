import { FmtCurrencyPipe } from './fmt-currency.pipe';

describe('FmtCurrencyPipe', () => {
  const pipe = new FmtCurrencyPipe();

  it('formats integer value', () => {
    expect(pipe.transform(1000)).toBe('R$ 1.000,00');
  });

  it('formats decimal value', () => {
    expect(pipe.transform(795.18)).toBe('R$ 795,18');
  });

  it('formats zero', () => {
    expect(pipe.transform(0)).toBe('R$ 0,00');
  });

  it('formats large value with thousands separator', () => {
    expect(pipe.transform(20000)).toBe('R$ 20.000,00');
  });
});
