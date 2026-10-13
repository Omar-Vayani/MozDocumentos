// Per-category legal values, merged into LAWS and LEGAL by mz-legal.ts.
import { LAWS_ADVOCACIA, LEGAL_ADVOCACIA } from './advocacia';
import { LAWS_SAUDE, LEGAL_SAUDE } from './saude';
import { LAWS_EDUCACAO, LEGAL_EDUCACAO } from './educacao';
import { LAWS_ASSOCIACOES, LEGAL_ASSOCIACOES } from './associacoes';
import { LAWS_COMUNIDADE, LEGAL_COMUNIDADE } from './comunidade';
import { LAWS_CONSTRUCAO, LEGAL_CONSTRUCAO } from './construcao';
import { LAWS_EVENTOS, LEGAL_EVENTOS } from './eventos';
import { LAWS_COMERCIO, LEGAL_COMERCIO } from './comercio';
import { LAWS_CONTRATOS, LEGAL_CONTRATOS } from './contratos';
import { LAWS_ESTADO, LEGAL_ESTADO } from './estado';
import { LAWS_PESSOAL_RH, LEGAL_PESSOAL_RH } from './pessoal-rh';
import { LAWS_SOCIEDADES, LEGAL_SOCIEDADES } from './sociedades';

export const LAWS_EXTRA = { ...LAWS_ADVOCACIA, ...LAWS_CONTRATOS, ...LAWS_SOCIEDADES, ...LAWS_ESTADO, ...LAWS_PESSOAL_RH, ...LAWS_SAUDE, ...LAWS_EDUCACAO, ...LAWS_ASSOCIACOES, ...LAWS_COMUNIDADE, ...LAWS_CONSTRUCAO, ...LAWS_EVENTOS, ...LAWS_COMERCIO };
export const LEGAL_EXTRA = { ...LEGAL_ADVOCACIA, ...LEGAL_CONTRATOS, ...LEGAL_SOCIEDADES, ...LEGAL_ESTADO, ...LEGAL_PESSOAL_RH, ...LEGAL_SAUDE, ...LEGAL_EDUCACAO, ...LEGAL_ASSOCIACOES, ...LEGAL_COMUNIDADE, ...LEGAL_CONSTRUCAO, ...LEGAL_EVENTOS, ...LEGAL_COMERCIO };
