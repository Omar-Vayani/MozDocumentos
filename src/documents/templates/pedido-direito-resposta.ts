// Pedido de direito de resposta ou de rectificação: letter to the editor of a
// newspaper, radio, TV station or online publication by a person or company
// named in a publication, with the text to be published. Regime of the Press
// Law carried into the 2026 Media Law (deadlines to confirm in the BR).

import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, DOC_TIPO_OPTIONS, GENERO_OPTIONS, isF, l } from './_shared';
import { semPonto, str } from './_contratos';
import { linhas } from './_digital';

const empresa = (v: Values) => v.requerenteTipo === 'empresa';
const ORGAO: Record<string, { o: string; de: string; edicao: string }> = {
  jornal: { o: 'jornal', de: 'do jornal', edicao: 'na primeira edição publicada após a recepção deste pedido' },
  revista: { o: 'revista', de: 'da revista', edicao: 'na primeira edição publicada após a recepção deste pedido' },
  radio: { o: 'estação de rádio', de: 'da rádio', edicao: 'na primeira emissão do mesmo programa, ou em horário de audiência equivalente, após a recepção deste pedido' },
  televisao: { o: 'estação de televisão', de: 'da televisão', edicao: 'na primeira emissão do mesmo programa, ou em horário de audiência equivalente, após a recepção deste pedido' },
  online: { o: 'publicação electrónica', de: 'da publicação', edicao: 'no prazo mais curto possível após a recepção deste pedido, mantendo-se acessível enquanto a peça o estiver' },
};

export default defineTemplate({
  id: 'pedido-direito-resposta',
  family: 'carta',
  letterhead: false,
  sections: [
    { id: 'requerente', title: l('Quem pede', 'Requester'), personRole: 'outro' },
    { id: 'orgao', title: l('Órgão de comunicação social', 'Media outlet') },
    { id: 'peca', title: l('Peça publicada', 'Published item') },
    { id: 'resposta', title: l('Resposta', 'Reply') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'requerenteTipo', type: 'radio', section: 'requerente', label: l('Quem pede', 'Requester'), options: [{ value: 'pessoa', label: l('Pessoa singular', 'Individual') }, { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') }], default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa') },
    { name: 'requerenteNome', type: 'text', section: 'requerente', required: true, label: l('Nome ou denominação', 'Name'), personKey: 'nome', default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || '' : c.profile?.nome || '') },
    { name: 'requerenteGenero', type: 'radio', section: 'requerente', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero || 'M' : 'M'), showIf: (v) => !empresa(v), personKey: 'genero' },
    { name: 'requerenteDocTipo', type: 'select', section: 'requerente', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => !empresa(v), personKey: 'docTipo' },
    { name: 'requerenteDocNumero', type: 'text', section: 'requerente', width: 'half', label: l('Número do documento / NUIT da empresa', 'ID number / company NUIT'), personKey: 'docNumero', default: (c) => (c.profile?.kind === 'empresa' ? c.profile.nuit || '' : c.profile?.docNumero || '') },
    { name: 'requerenteMorada', type: 'text', section: 'requerente', label: l('Morada ou sede', 'Address'), personKey: 'morada', default: (c) => (c.profile ? [c.profile.morada?.rua, c.profile.morada?.numero ? `n.º ${c.profile.morada.numero}` : '', c.profile.morada?.cidade].filter(Boolean).join(', ') : '') },
    { name: 'requerenteContacto', type: 'text', section: 'requerente', label: l('Telefone e e-mail', 'Phone and e-mail'), default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' · ') },
    { name: 'representante', type: 'text', section: 'requerente', width: 'half', label: l('Quem assina pela empresa', 'Signatory for the company'), default: (c) => c.profile?.representanteNome || '', showIf: empresa },
    { name: 'representanteCargo', type: 'text', section: 'requerente', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || '', showIf: empresa },

    { name: 'orgaoTipo', type: 'select', section: 'orgao', width: 'half', label: l('Tipo', 'Kind'), options: [{ value: 'jornal', label: l('Jornal', 'Newspaper') }, { value: 'revista', label: l('Revista', 'Magazine') }, { value: 'radio', label: l('Rádio', 'Radio') }, { value: 'televisao', label: l('Televisão', 'Television') }, { value: 'online', label: l('Publicação online', 'Online publication') }], default: 'jornal' },
    { name: 'orgaoNome', type: 'text', section: 'orgao', width: 'half', required: true, label: l('Nome do órgão', 'Outlet name'), placeholder: l('Ex.: jornal "Notícias"', 'E.g. "Notícias" newspaper') },
    { name: 'directorNome', type: 'text', section: 'orgao', width: 'half', label: l('Nome do director (opcional)', 'Editor’s name (optional)') },
    { name: 'directorGenero', type: 'radio', section: 'orgao', width: 'half', label: l('Director / Directora', 'Editor'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'orgaoMorada', type: 'text', section: 'orgao', label: l('Morada ou e-mail da redacção', 'Newsroom address or e-mail') },

    { name: 'pecaTitulo', type: 'text', section: 'peca', required: true, label: l('Título da peça', 'Title of the item') },
    { name: 'pecaData', type: 'date', section: 'peca', width: 'half', required: true, label: l('Data da publicação ou emissão', 'Publication or broadcast date') },
    { name: 'pecaLocal', type: 'text', section: 'peca', width: 'half', label: l('Página, programa, hora ou ligação', 'Page, programme, time or link') },
    { name: 'tipo', type: 'radio', section: 'resposta', label: l('O que pede', 'Request'), options: [{ value: 'resposta', label: l('Direito de resposta (a peça afecta a sua reputação)', 'Right of reply (the item harms reputation)') }, { value: 'rectificacao', label: l('Rectificação (a peça contém factos falsos ou errados)', 'Correction (false or wrong facts)') }, { value: 'ambos', label: l('Resposta e rectificação', 'Reply and correction') }], default: 'ambos' },
    { name: 'factos', type: 'textarea', section: 'resposta', rows: 4, required: true, label: l('O que foi publicado e porque é falso ou ofensivo', 'What was published and why it is false or offensive'), help: l('Um ponto por linha. Seja objectivo.', 'One point per line. Be factual.') },
    { name: 'textoResposta', type: 'textarea', section: 'resposta', rows: 8, required: true, label: l('Texto da resposta a publicar', 'Reply text to be published'), help: l('Responda só ao que foi publicado, sem expressões ofensivas. Não deve ser mais extenso do que a peça a que responde.', 'Reply only to what was published, without offensive language; no longer than the item.') },
    { name: 'reserva', type: 'toggle', section: 'resposta', default: true, label: l('Reservar o direito de agir judicialmente', 'Reserve the right to take legal action') },
    { name: 'anexos', type: 'textarea', section: 'resposta', rows: 2, label: l('Anexos', 'Attachments'), default: 'Cópia da peça publicada\nCópia do documento de identificação' },

    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.textoResposta)) w.push({ level: 'error', field: 'textoResposta', message: l('Escreva o texto da resposta a publicar.', 'Write the reply text.') });
    w.push({ level: 'warning', message: l(`O pedido tem prazo legal contado da publicação ou emissão: envie-o quanto antes, por carta registada com aviso de recepção ou entregue na redacção contra recibo, assinado e com cópia do documento de identificação (${cite('digDireitoResposta')}).`, 'There is a legal deadline from publication or broadcast: send it as soon as possible by registered letter or hand it in against receipt, signed and with a copy of your ID.') });
    if (linhas(v.textoResposta).join(' ').length > 3000) w.push({ level: 'info', field: 'textoResposta', message: l('A resposta é longa. O órgão pode recusar o excesso se for mais extensa do que a peça.', 'The reply is long; the outlet may refuse the excess if longer than the item.') });
    return w;
  },

  personName: (v) => str(v.requerenteNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const emp = empresa(v);
    const f = !emp && isF(v.requerenteGenero);
    const org = ORGAO[str(v.orgaoTipo)] ?? ORGAO.jornal;
    const dirF = isF(v.directorGenero);
    const nome = str(v.requerenteNome) || BLANK;
    const tipo = str(v.tipo) || 'ambos';
    const direito = tipo === 'resposta' ? 'direito de resposta' : tipo === 'rectificacao' ? 'direito de rectificação' : 'direito de resposta e de rectificação';
    const doc = emp ? (str(v.requerenteDocNumero) ? `NUIT ${str(v.requerenteDocNumero)}` : '') : `${f ? 'portadora' : 'portador'} do ${v.requerenteDocTipo === 'Passaporte' ? 'Passaporte' : v.requerenteDocTipo === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade'} n.º ${str(v.requerenteDocNumero) || BLANK}`;
    const ident = [`**${nome}**`, doc, `${emp ? 'com sede em' : 'residente em'} ${semPonto(v.requerenteMorada) || BLANK}`, emp && str(v.representante) ? `representada por ${str(v.representante)}${str(v.representanteCargo) ? `, ${str(v.representanteCargo)}` : ''}` : ''].filter(Boolean).join(', ');
    const factos = linhas(v.factos);
    const resposta = linhas(v.textoResposta);
    const anexos = linhas(v.anexos);

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: [`**${nome}**`, str(v.requerenteMorada), str(v.requerenteContacto)].filter(Boolean).join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: dirF ? 'Exma. Senhora' : 'Exmo. Senhor',
        lines: [str(v.directorNome), `${dirF ? 'Directora' : 'Director'} ${org.de} ${str(v.orgaoNome) || BLANK}`, str(v.orgaoMorada)].filter(Boolean),
      },
      { type: 'subject', text: `Exercício do ${direito} — "${str(v.pecaTitulo) || BLANK}", de ${dateLong(v.pecaData)}` },
      { type: 'salutation', text: `${dirF ? 'Exma. Senhora Directora' : 'Exmo. Senhor Director'},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${ident}, vem, ao abrigo da ${cite('digDireitoResposta')}, exercer o ${direito} relativamente à peça intitulada **"${str(v.pecaTitulo) || BLANK}"**, ${['radio', 'televisao'].includes(str(v.orgaoTipo)) ? 'emitida' : 'publicada'} em ${dateLong(v.pecaData)}${str(v.pecaLocal) ? ` (${semPonto(v.pecaLocal)})` : ''}, em que ${emp ? 'é referida' : f ? 'é referida' : 'é referido'}.`,
        en: `The requester exercises the right of ${tipo === 'resposta' ? 'reply' : tipo === 'rectificacao' ? 'correction' : 'reply and correction'} regarding the item named, published on the stated date, in which they are mentioned.`,
      },
      { type: 'paragraph', id: 'factosIntro', text: `A referida peça ${tipo === 'resposta' ? 'contém referências que afectam' : tipo === 'rectificacao' ? 'contém factos inverídicos ou erróneos que afectam' : 'contém factos inverídicos e referências que afectam'} a reputação e o bom nome ${emp ? 'da requerente' : f ? 'da requerente' : 'do requerente'}, designadamente:`, en: 'The item contains statements that are untrue or harm the requester’s reputation, namely:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map((s) => semPonto(s) + '.') : [BLANK] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª a publicação gratuita do texto que se segue, ${org.edicao}, no mesmo local e com o mesmo destaque da peça, sem cortes, comentários ou interpolações, nos termos e no prazo previstos na lei.`,
        en: 'The requester asks for free publication of the following text, in the same place and with the same prominence, without cuts or comments, within the legal period.',
      },
      { type: 'heading', text: 'Texto da resposta', align: 'center' },
      ...(resposta.length
        ? resposta.map((t, i) => ({ type: 'paragraph' as const, id: `resposta_${i}`, text: t, en: 'Reply text.' }))
        : [{ type: 'box' as const, label: 'Texto a publicar', lines: 10 }]),
      { type: 'paragraph', id: 'assinaturaResposta', text: `${nome}${emp && str(v.representante) ? ` (${str(v.representante)}${str(v.representanteCargo) ? `, ${str(v.representanteCargo)}` : ''})` : ''}`, align: 'right', en: 'Signed by the requester.' },
      { type: 'spacer', size: 'small' },
    ];
    if (v.reserva) {
      blocks.push({
        type: 'paragraph',
        id: 'reserva',
        text: `O exercício deste direito não prejudica o recurso aos meios judiciais, civis e criminais, para reparação dos danos causados, que se reserva o direito de utilizar, nem a participação à entidade reguladora da comunicação social.`,
        en: 'This does not prejudice civil or criminal legal action or a complaint to the media regulator.',
      });
    }
    blocks.push({ type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true });
    const col: SignatureColumn = emp
      ? { role: 'Pela Requerente', name: str(v.representante) || undefined, detail: [str(v.representanteCargo), nome !== BLANK ? nome : ''].filter(Boolean).join(', ') || undefined, image: ctx.profile?.kind === 'empresa' ? 'both' : undefined }
      : { role: f ? 'A Requerente' : 'O Requerente', name: nome !== BLANK ? nome : undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined };
    blocks.push({ type: 'signatures', columns: [col] });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos.map(semPonto) });
    return blocks;
  },
});
