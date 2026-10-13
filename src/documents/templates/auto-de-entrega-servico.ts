// Auto de Entrega e Recepção: handover record when an official leaves a post
// (transfer, retirement, end of appointment, temporary replacement). It lists
// pending files, records, assets and access handed to the successor.

import { inteiroPorExtenso } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, dateField, g, l, lineItems, localField, splitLines } from './_shared';
import { dataPorExtenso, endDot, estadoWarnings, str, stripNumber } from './_estado';

const MOTIVOS: Record<string, string> = {
  cessacao: 'por cessação de funções',
  transferencia: 'por transferência',
  aposentacao: 'por aposentação',
  substituicao: 'por substituição temporária',
  ausencia: 'por ausência prolongada',
};

export default defineTemplate({
  id: 'auto-de-entrega-servico',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Acto', 'Handover') },
    { id: 'partes', title: l('Quem entrega e quem recebe', 'Outgoing and incoming') },
    { id: 'conteudo', title: l('O que se entrega', 'What is handed over') },
    { id: 'assinatura', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da entrega', 'Handover date')),
    { name: 'localActo', type: 'text', section: 'documento', label: l('Sala ou gabinete (opcional)', 'Room or office (optional)'), placeholder: l('Ex.: Gabinete do Director do Hospital Distrital', 'E.g. Office of the District Hospital Director') },
    {
      name: 'posto',
      type: 'text',
      section: 'documento',
      required: true,
      label: l('Cargo ou sector entregue', 'Post or unit handed over'),
      placeholder: l('Ex.: Direcção do Hospital Distrital de Ribáuè', 'E.g. Management of Ribáuè District Hospital'),
    },
    {
      name: 'motivo',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Motivo', 'Reason'),
      options: [
        { value: 'cessacao', label: l('Cessação de funções', 'End of appointment') },
        { value: 'transferencia', label: l('Transferência', 'Transfer') },
        { value: 'aposentacao', label: l('Aposentação', 'Retirement') },
        { value: 'substituicao', label: l('Substituição temporária', 'Temporary replacement') },
        { value: 'ausencia', label: l('Ausência prolongada (férias, licença)', 'Long absence (leave)') },
      ],
      default: 'cessacao',
    },
    { name: 'cessanteNome', type: 'text', section: 'partes', width: 'half', required: true, label: l('Quem entrega (cessante)', 'Outgoing holder') },
    { name: 'cessanteGenero', type: 'radio', section: 'partes', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'cessanteCargo', type: 'text', section: 'partes', width: 'half', label: l('Cargo de quem entrega', 'Outgoing holder’s position') },
    { name: 'entranteNome', type: 'text', section: 'partes', width: 'half', required: true, label: l('Quem recebe', 'Incoming holder') },
    { name: 'entranteGenero', type: 'radio', section: 'partes', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'entranteCargo', type: 'text', section: 'partes', width: 'half', label: l('Cargo de quem recebe', 'Incoming holder’s position') },
    { name: 'designacao', type: 'text', section: 'partes', label: l('Designado por (opcional)', 'Designated by (optional)'), placeholder: l('Ex.: Despacho do Director Provincial de 1 de Outubro de 2026', 'E.g. Order of the Provincial Director of 1 October 2026') },
    { name: 'testemunhaNome', type: 'text', section: 'partes', width: 'half', label: l('Na presença de (opcional)', 'In the presence of (optional)') },
    { name: 'testemunhaCargo', type: 'text', section: 'partes', width: 'half', label: l('Cargo', 'Position'), placeholder: l('Ex.: Director Provincial Adjunto', 'E.g. Deputy Provincial Director') },
    {
      name: 'pendentes',
      type: 'lines',
      section: 'conteudo',
      label: l('Processos e assuntos pendentes', 'Pending files and matters'),
      addLabel: l('Adicionar assunto', 'Add matter'),
      columns: [
        { name: 'assunto', type: 'text', label: l('Assunto', 'Matter') },
        { name: 'situacao', type: 'text', label: l('Ponto de situação', 'Status') },
        { name: 'prazo', type: 'text', label: l('Prazo / próximo passo', 'Deadline / next step') },
      ],
      default: [],
    },
    { name: 'documentacao', type: 'textarea', section: 'conteudo', rows: 3, label: l('Documentação e arquivo', 'Records and files'), help: l('Um item por linha. Ex.: Arquivo corrente do sector (3 pastas).', 'One item per line.') },
    {
      name: 'bens',
      type: 'lines',
      section: 'conteudo',
      label: l('Bens patrimoniais', 'Assets'),
      addLabel: l('Adicionar bem', 'Add asset'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'inventario', type: 'text', label: l('N.º de inventário', 'Inventory no.') },
        { name: 'quantidade', type: 'number', label: l('Quantidade', 'Quantity') },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition') },
      ],
      default: [],
    },
    { name: 'valores', type: 'textarea', section: 'conteudo', rows: 2, label: l('Valores e fundos (opcional)', 'Cash and funds (optional)'), help: l('Ex.: fundo de maneio, com o saldo conferido.', 'E.g. petty cash, with the balance checked.') },
    {
      name: 'acessos',
      type: 'textarea',
      section: 'conteudo',
      rows: 3,
      label: l('Viaturas, chaves e acessos', 'Vehicles, keys and access'),
      help: l('Não escreva senhas no auto: indique só que foram entregues ou alteradas.', 'Do not write passwords in the record: only state that they were handed over or changed.'),
    },
    { name: 'observacoes', type: 'textarea', section: 'conteudo', rows: 2, label: l('Observações (opcional)', 'Remarks (optional)') },
    { name: 'exemplares', type: 'number', section: 'assinatura', width: 'half', min: 1, max: 6, label: l('Número de exemplares', 'Number of copies'), default: 3 },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!str(v.cessanteNome) || !str(v.entranteNome)) w.push({ level: 'warning', field: 'cessanteNome', message: l('Indique quem entrega e quem recebe.', 'Enter who hands over and who receives.') });
    if (/senha\s*[:=]/i.test(str(v.acessos))) {
      w.push({ level: 'warning', field: 'acessos', message: l('Retire as senhas do texto: o auto circula em papel.', 'Remove passwords from the text: the record circulates on paper.') });
    }
    return w;
  },

  personName: (v) => v.cessanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ces = { nome: str(v.cessanteNome) || BLANK, cargo: str(v.cessanteCargo) };
    const ent = { nome: str(v.entranteNome) || BLANK, cargo: str(v.entranteCargo) };
    const tes = { nome: str(v.testemunhaNome), cargo: str(v.testemunhaCargo) };
    const sala = str(v.localActo).replace(/[.,;]+$/, '');
    const onde = `em ${ctx.place}${sala ? `, ${/^(no|na)\s/i.test(sala) ? sala : `no ${sala}`}` : ''}`;
    const motivo = MOTIVOS[v.motivo as string] ?? '';
    const desig = str(v.designacao).replace(/[.,;]+$/, '');
    const presenca = tes.nome ? `, na presença de ${tes.nome}${tes.cargo ? `, ${tes.cargo}` : ''}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Auto de Entrega e Recepção', subtitle: str(v.posto) || undefined },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${onde}, ${g(v.cessanteGenero, 'o Senhor', 'a Senhora')} **${ces.nome}**${ces.cargo ? `, ${ces.cargo}` : ''}, procedeu, ${motivo || 'nos termos superiormente determinados'}, à entrega ${daPosto(str(v.posto))} ${g(v.entranteGenero, 'ao Senhor', 'à Senhora')} **${ent.nome}**${ent.cargo ? `, ${ent.cargo}` : ''}${desig ? `, designad${v.entranteGenero === 'F' ? 'a' : 'o'} por ${desig}` : ''}${presenca}, nos termos seguintes:`,
        en: 'Date and place; the outgoing holder hands the post over to the incoming holder, as follows:',
      },
    ];

    let n = 0;
    const sec = (titulo: string) => blocks.push({ type: 'heading', text: `${++n}. ${titulo}` });

    const pend = lineItems(v.pendentes).filter((p) => str(p.assunto));
    sec('Processos e assuntos pendentes');
    if (pend.length) {
      blocks.push({
        type: 'table',
        columns: [{ label: 'N.º', width: 0.07, align: 'center' }, { label: 'Assunto', width: 0.38 }, { label: 'Ponto de situação', width: 0.33 }, { label: 'Prazo / próximo passo', width: 0.22 }],
        rows: pend.map((p, i) => [String(i + 1), str(p.assunto), str(p.situacao), str(p.prazo)]),
      });
    } else {
      blocks.push({ type: 'paragraph', id: 'pendentes-nada', text: 'Não há processos ou assuntos pendentes.', en: 'No pending matters.' });
    }

    const docs = splitLines(v.documentacao).map((d) => endDot(stripNumber(d)).replace(/\.$/, ''));
    sec('Documentação e arquivo');
    if (docs.length) blocks.push({ type: 'list', style: 'bullet', items: docs });
    else blocks.push({ type: 'paragraph', id: 'documentacao-nada', text: 'Foi entregue o arquivo corrente do sector, devidamente organizado.', en: 'The current files of the unit were handed over.' });

    const bens = lineItems(v.bens).filter((b) => str(b.descricao));
    sec('Bens patrimoniais');
    if (bens.length) {
      blocks.push({
        type: 'table',
        columns: [{ label: 'N.º', width: 0.07, align: 'center' }, { label: 'Descrição', width: 0.43 }, { label: 'N.º inventário', width: 0.18 }, { label: 'Qtd.', width: 0.1, align: 'center' }, { label: 'Estado', width: 0.22 }],
        rows: bens.map((b, i) => [String(i + 1), str(b.descricao), str(b.inventario), str(b.quantidade) || '1', str(b.estado)]),
      });
    } else {
      blocks.push({ type: 'paragraph', id: 'bens-nada', text: 'Os bens afectos ao sector constam do inventário em vigor, que foi conferido.', en: 'The unit’s assets are those in the current inventory, which was checked.' });
    }

    if (str(v.valores)) {
      sec('Valores e fundos');
      blocks.push({ type: 'paragraph', id: 'valores', text: str(v.valores), en: 'Cash and funds handed over.' });
    }
    const acessos = splitLines(v.acessos).map((d) => endDot(stripNumber(d)).replace(/\.$/, ''));
    if (acessos.length) {
      sec('Viaturas, chaves e acessos');
      blocks.push({ type: 'list', style: 'bullet', items: acessos });
    }
    if (str(v.observacoes)) {
      sec('Observações');
      blocks.push({ type: 'paragraph', id: 'observacoes', text: str(v.observacoes), en: 'Remarks.' });
    }

    const ex = Math.max(1, Math.min(6, Number(v.exemplares) || 3));
    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `E, por estarem conformes, vai o presente auto, depois de lido, ser assinado pelos intervenientes, em ${inteiroPorExtenso(ex) === 'um' ? 'um exemplar' : `${inteiroPorExtenso(ex)} exemplares de igual valor`}.`,
        keepWithNext: true,
        en: 'Being in order, this record is read and signed by those involved, in the stated number of copies.',
      },
      {
        type: 'signatures',
        columns: [
          { role: 'Entregou', name: ces.nome === BLANK ? undefined : ces.nome, detail: ces.cargo || undefined },
          { role: 'Recebeu', name: ent.nome === BLANK ? undefined : ent.nome, detail: ent.cargo || undefined },
          ...(tes.nome ? [{ role: 'Testemunhou', name: tes.nome, detail: tes.cargo || undefined }] : []),
        ],
      },
    );
    return blocks;
  },
});

/** "do cargo de Director…" / "da Direcção do Hospital…" */
function daPosto(posto: string): string {
  if (!posto) return `do cargo de ${BLANK}`;
  const p = posto.replace(/^(o|a|do|da)\s+/i, '');
  return /^(Direcção|Repartição|Secção|Chefia|Delegação|Unidade|Secretaria|Administração|Coordenação|Inspecção)\b/i.test(p) ? `da ${p}` : `do ${p}`;
}
