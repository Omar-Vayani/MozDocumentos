// Per-category legal values, merged into LAWS and LEGAL by mz-legal.ts.
import { LAWS_ADVOCACIA, LEGAL_ADVOCACIA } from './advocacia';
import { LAWS_CONTRATOS, LEGAL_CONTRATOS } from './contratos';
import { LAWS_ESTADO, LEGAL_ESTADO } from './estado';
import { LAWS_PESSOAL_RH, LEGAL_PESSOAL_RH } from './pessoal-rh';
import { LAWS_SOCIEDADES, LEGAL_SOCIEDADES } from './sociedades';

export const LAWS_EXTRA = { ...LAWS_ADVOCACIA, ...LAWS_CONTRATOS, ...LAWS_SOCIEDADES, ...LAWS_ESTADO, ...LAWS_PESSOAL_RH };
export const LEGAL_EXTRA = { ...LEGAL_ADVOCACIA, ...LEGAL_CONTRATOS, ...LEGAL_SOCIEDADES, ...LEGAL_ESTADO, ...LEGAL_PESSOAL_RH };
