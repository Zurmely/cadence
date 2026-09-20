import { describe, expect, it } from 'vitest';
import enUS from '../../i18n/en-US.json';
import ptBR from '../../i18n/pt-BR.json';
import { collectKeys, t } from './index';

describe('i18n catalogs', () => {
  it('keeps en-US and pt-BR keys in parity', () => {
    const enKeys = collectKeys(enUS).sort();
    const ptKeys = collectKeys(ptBR).sort();
    expect(ptKeys).toEqual(enKeys);
  });

  it('resolves a typed key for both locales', () => {
    expect(t('en-US', 'nav.home')).toBe('Profile');
    expect(t('pt-BR', 'nav.home')).toBe('Perfil');
    expect(t('en-US', 'profile.advanced')).toBe('Advanced options');
    expect(t('pt-BR', 'profile.advanced')).toBe('Opções avançadas');
  });
});
