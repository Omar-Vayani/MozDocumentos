import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, diffDays } from '@/lib/format';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type FieldDef, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, g, l, lineItems, localField, splitLines, workerFields, workerSignature,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

/** Author fields default from a personal profile (the worker writes this document). */
const fromPessoa = (f: FieldDef, get: (p: Profile) => unknown): FieldDef => ({
  ...f,
  default: (c) => (c.profile?.kind === 'pessoa' ? get(c.profile) ?? '' : f.default ?? ''),
});

const [fNome, fGenero, fCargo, fDepartamento, fMorada, fTelefone] = workerFields(['nome', 'genero', 'cargo', 'departamento', 'morada', 'telefone']);

export default defineTemplate({
  id: 'resposta-nota-de-culpa',
  letterhead: false,
  sections: [
    { id: 'trabalhador', title: l('Os seus dados', 'Your details'), personRole: 'trabalhador' },
    { id: 'documento', title: l('Empresa e processo', 'Employer and case') },
    { id: 'factos', title: l('Dos factos', 'On the facts') },
    { id: 'defesa', title: l('Da defesa', 'Defence') },
    { id: 'prova', title: l('Prova', 'Evidence') },
  ],
  fields: [
    fromPessoa(fNome, (p) => p.nome),
    fGenero,
    fCargo,
    fDepartamento,
    fromPessoa(fMorada, (p) => addressLine(p)),
    fTelefone,
    {
      name: 'empresaNome',
      type: 'text',
      section: 'documento',
      required: true,
      label: l('Nome da empresa (entidade empregadora)', 'Employer name'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
    {
      name: 'destinatarioAtencao',
      type: 'text',
      section: 'documento',
      label: l('Ao cuidado de (opcional)', 'For the attention of (optional)'),
      placeholder: l('Ex.: Instrutor do processo disciplinar', 'E.g. Disciplinary case investigator'),
    },
    {
      name: 'processoNumero',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('N.º do processo disciplinar', 'Disciplinary case number'),
      help: l('Copie o número que consta da nota de culpa.', 'Copy the number shown on the charge.'),
    },
    {
      name: 'dataNotaCulpa',
      type: 'date',
      section: 'documento',
      width: 'half',
      required: true,
      label: l('Data em que recebeu a nota de culpa', 'Date you received the charge'),
      legal: l('O prazo para responder conta a partir desta data.', 'The reply deadline runs from this date.'),
    },
    localField(),
    dateField('data', 'documento', l('Data da resposta', 'Date of the reply')),
    {
      name: 'factos',
      type: 'textarea',
      section: 'factos',
      rows: 6,
      label: l('Factos que contesta', 'Facts you dispute'),
      help: l(
        'Um ponto por linha. Indique cada facto da nota de culpa que não é verdadeiro e o que realmente aconteceu.',
        'One point per line. State each fact in the charge that is not true and what really happened.',
      ),
      placeholder: l(
        'Ex.: Não é verdade que me ausentei sem autorização: a saída foi autorizada pelo chefe de turno.',
        'E.g. It is not true that I left without permission: the shift supervisor authorised it.',
      ),
    },
    {
      name: 'defesa',
      type: 'textarea',
      section: 'defesa',
      required: true,
      rows: 7,
      label: l('A sua defesa', 'Your defence'),
      help: l(
        'Explique as circunstâncias, as razões do seu comportamento e tudo o que o justifique ou atenue (bom comportamento anterior, antiguidade, ordens recebidas).',
        'Explain the circumstances, your reasons and anything that justifies or mitigates it (good record, seniority, orders received).',
      ),
    },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'prova',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'contacto', type: 'text', label: l('Contacto ou função', 'Contact or position') },
      ],
      default: [],
    },
    {
      name: 'documentos',
      type: 'lines',
      section: 'prova',
      label: l('Documentos anexos', 'Attached documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Cópia da escala de serviço de Setembro', 'E.g. Copy of the September duty roster') }],
      default: [],
    },
    {
      name: 'diligencias',
      type: 'textarea',
      section: 'prova',
      rows: 3,
      label: l('Diligências de prova requeridas (opcional)', 'Evidence requested (optional)'),
      placeholder: l('Ex.: Visualização das imagens de vídeo do armazém do dia 12', 'E.g. Review of the warehouse CCTV footage of the 12th'),
    },
    {
      name: 'pedidoAudicao',
      type: 'toggle',
      section: 'prova',
      default: true,
      label: l('Pedir para ser ouvido em audição', 'Ask to be heard at a hearing'),
    },
  ],

  computed: (v, { legal }) => {
    const prazo = legal.value<number>('notaCulpaPrazoResposta');
    return { prazoResposta: prazo, limiteResposta: v.dataNotaCulpa ? addDays(v.dataNotaCulpa, prazo) : null };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.limiteResposta && v.data && diffDays(c.limiteResposta, v.data) > 0) {
      w.push({
        level: 'error',
        field: 'data',
        message: l(
          `O prazo de resposta (${c.prazoResposta} dias) terminou em ${dateLong(c.limiteResposta)}. Uma resposta fora do prazo pode não ser considerada.`,
          `The reply period (${c.prazoResposta} days) ended on ${c.limiteResposta}. A late reply may not be considered.`,
        ),
      });
    } else if (c.limiteResposta) {
      w.push({
        level: 'info',
        field: 'dataNotaCulpa',
        message: l(
          `Entregue a resposta até ${dateLong(c.limiteResposta)} e peça que assinem a recepção na sua cópia.`,
          `Deliver the reply by ${c.limiteResposta} and have the employer sign receipt on your copy.`,
        ),
      });
    }
    if (v.dataNotaCulpa && v.data && diffDays(v.dataNotaCulpa, v.data) < 0) {
      w.push({ level: 'error', field: 'dataNotaCulpa', message: l('A data da resposta é anterior à recepção da nota de culpa.', 'The reply date is before the charge was received.') });
    }
    if (!String(v.defesa ?? '').trim()) {
      w.push({ level: 'warning', field: 'defesa', message: l('Escreva a sua defesa.', 'Write your defence.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const empresa = v.empresaNome || BLANK;
    const factos = splitLines(v.factos);
    const testemunhas = lineItems(v.testemunhas).filter((t) => String(t.nome ?? '').trim());
    const documentos = lineItems(v.documentos).map((d) => String(d.descricao ?? '').trim()).filter(Boolean);
    const diligencias = splitLines(v.diligencias);
    const Trab = g(ge, 'O trabalhador', 'A trabalhadora');
    const funcao = [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(', ');

    const remetente = [
      `**${v.trabalhadorNome || BLANK}**`,
      funcao,
      v.trabalhadorMorada,
      v.trabalhadorTelefone ? `Tel. ${v.trabalhadorTelefone}` : '',
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: remetente.join('\n'), align: 'left', editable: false },
      {
        type: 'recipient',
        salutation: 'Exmos. Senhores',
        lines: [empresa, v.destinatarioAtencao ? `A/C: ${v.destinatarioAtencao}` : ''],
      },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'subject', text: `Resposta à nota de culpa — Processo disciplinar n.º ${v.processoNumero || BLANK}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `**${v.trabalhadorNome || BLANK}**${funcao ? `, ${funcao}` : ''}, ${g(ge, 'notificado', 'notificada')} em ${dateLong(v.dataNotaCulpa)} da nota de culpa deduzida no processo disciplinar acima referido, vem, nos termos ${doCite('notaCulpaPrazoResposta')} (Lei do Trabalho), apresentar a sua resposta, nos termos e com os fundamentos seguintes:`,
        en: `${v.trabalhadorNome || 'The employee'}, notified${v.dataNotaCulpa ? ` on ${v.dataNotaCulpa}` : ''} of the charge in the above disciplinary case, submits the following reply under the Labour Law:`,
      },
      { type: 'heading', text: 'I. Dos factos' },
    ];
    if (factos.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'impugnacao',
          text: `${Trab} impugna os factos que lhe são imputados na nota de culpa, nos termos seguintes:`,
          en: 'The employee disputes the facts alleged in the charge, as follows:',
        },
        { type: 'list', style: 'numeric', items: factos },
      );
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'impugnacao',
        text: `${Trab} impugna os factos que lhe são imputados na nota de culpa, por não corresponderem à verdade.`,
        en: 'The employee disputes the facts alleged in the charge as untrue.',
      });
    }
    blocks.push({ type: 'heading', text: 'II. Da defesa' });
    blocks.push({
      type: 'paragraph',
      id: 'defesa',
      text: String(v.defesa ?? '').trim() || `${BLANK} ${BLANK} ${BLANK} ${BLANK}\n${BLANK} ${BLANK} ${BLANK} ${BLANK}`,
      en: 'The employee’s defence, as written above.',
    });

    if (testemunhas.length || documentos.length || diligencias.length) {
      blocks.push({ type: 'heading', text: 'III. Da prova' });
      if (testemunhas.length) {
        blocks.push(
          {
            type: 'paragraph',
            id: 'testemunhas',
            text: 'Para prova do alegado, indica as seguintes testemunhas, cuja audição requer:',
            en: 'To prove the above, the employee names the following witnesses and asks that they be heard:',
          },
          {
            type: 'table',
            columns: [
              { label: 'N.º', width: 0.4, align: 'center' },
              { label: 'Nome', width: 3 },
              { label: 'Contacto ou função', width: 2.2 },
            ],
            rows: testemunhas.map((t, i) => [String(i + 1), String(t.nome).trim(), String(t.contacto ?? '').trim()]),
          },
        );
      }
      if (documentos.length) {
        blocks.push({
          type: 'paragraph',
          id: 'documentos',
          text: `Junta ${documentos.length === 1 ? 'o documento indicado' : `os ${documentos.length} documentos indicados`} em anexo.`,
          en: 'The documents listed in the annex are attached.',
        });
      }
      if (diligencias.length) {
        blocks.push(
          {
            type: 'paragraph',
            id: 'diligencias',
            text: 'Requer ainda a realização das seguintes diligências de prova:',
            en: 'The employee also requests the following evidence:',
          },
          { type: 'list', style: 'alpha', items: diligencias },
        );
      }
    }

    blocks.push({ type: 'heading', text: testemunhas.length || documentos.length || diligencias.length ? 'IV. Do pedido' : 'III. Do pedido' });
    if (v.pedidoAudicao) {
      blocks.push({
        type: 'paragraph',
        id: 'pedidoAudicao',
        text: `${Trab} requer ser ${g(ge, 'ouvido', 'ouvida')} em audição, em data a designar, devendo a respectiva convocatória ser-lhe comunicada por escrito.`,
        en: 'The employee asks to be heard at a hearing on a date to be set, notified in writing.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'conclusao',
        text: `Termos em que, pelos fundamentos expostos, requer o arquivamento do processo disciplinar, por não se verificar qualquer infracção disciplinar que possa ser imputada ${g(ge, 'ao trabalhador', 'à trabalhadora')}.`,
        en: 'For these reasons, the employee requests that the disciplinary case be closed, as no disciplinary offence can be attributed to them.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Pede deferimento.', align: 'left', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          {
            ...workerSignature(v),
            image: ctx.profile?.kind === 'pessoa' && ctx.profile.nome && ctx.profile.nome === v.trabalhadorNome ? 'signature' : undefined,
          },
        ],
      },
    );
    if (documentos.length) blocks.push({ type: 'annexList', items: documentos });
    blocks.push({
      type: 'acknowledgement',
      text: `Recebido por ${empresa} em ___/___/______, às ____:____ horas.`,
      signer: 'Assinatura e carimbo',
    });
    return blocks;
  },
});
