// Notificação por uso não autorizado de obra ou de imagem (carta de
// interpelação / pedido de retirada de conteúdo): the author or rights holder,
// or the person whose image was used, asks the infringer or the platform to
// stop, remove the content and, optionally, pay compensation.

import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, GENERO_OPTIONS, isF, l, money } from './_shared';
import { semPonto, str, valorTexto } from './_contratos';
import { linhas, prazo } from './_digital';

const empresa = (v: Values) => v.titularTipo === 'empresa';

export default defineTemplate({
  id: 'notificacao-infracao-direitos-autor',
  family: 'carta',
  letterhead: false,
  sections: [
    { id: 'titular', title: l('Quem notifica', 'Sender'), personRole: 'outro' },
    { id: 'destinatario', title: l('Destinatário', 'Recipient'), personRole: 'outro' },
    { id: 'infraccao', title: l('Uso não autorizado', 'Unauthorised use') },
    { id: 'pedido', title: l('O que pede', 'Demands') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'motivo', type: 'radio', section: 'titular', label: l('Motivo', 'Ground'), options: [{ value: 'obra', label: l('Uso de obra protegida (foto, música, texto, vídeo, desenho, software)', 'Use of a protected work') }, { value: 'imagem', label: l('Uso da minha imagem sem autorização', 'Use of my image without consent') }], default: 'obra' },
    { name: 'titularTipo', type: 'radio', section: 'titular', label: l('Quem notifica', 'Sender'), options: [{ value: 'pessoa', label: l('Pessoa singular', 'Individual') }, { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') }], default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa') },
    { name: 'titularNome', type: 'text', section: 'titular', required: true, label: l('Nome ou denominação', 'Name'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || '' : c.profile?.nome || '') },
    { name: 'titularGenero', type: 'radio', section: 'titular', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero || 'M' : 'M'), showIf: (v) => !empresa(v) },
    { name: 'titularMorada', type: 'text', section: 'titular', label: l('Morada ou sede', 'Address'), default: (c) => (c.profile ? [c.profile.morada?.rua, c.profile.morada?.numero ? `n.º ${c.profile.morada.numero}` : '', c.profile.morada?.cidade].filter(Boolean).join(', ') : '') },
    { name: 'titularContacto', type: 'text', section: 'titular', label: l('Telefone e e-mail', 'Phone and e-mail'), default: (c) => [c.profile?.telefones, c.profile?.email].filter(Boolean).join(' · ') },
    { name: 'representante', type: 'text', section: 'titular', label: l('Quem assina (empresa ou advogado)', 'Signatory (company or lawyer)'), default: (c) => c.profile?.representanteNome || '' },

    { name: 'destNome', type: 'text', section: 'destinatario', required: true, label: l('Nome ou denominação', 'Name') },
    { name: 'destGenero', type: 'radio', section: 'destinatario', width: 'half', label: l('Tratamento', 'Form of address'), options: [...GENERO_OPTIONS, { value: 'E', label: l('Empresa (Exmos. Senhores)', 'Company') }], default: 'E' },
    { name: 'destMorada', type: 'text', section: 'destinatario', label: l('Morada, e-mail ou página', 'Address, e-mail or page') },

    { name: 'obra', type: 'text', section: 'infraccao', required: true, label: l('Obra ou imagem em causa', 'Work or image concerned'), placeholder: l('Ex.: fotografia "Pôr do sol na Ilha de Moçambique", de minha autoria', 'E.g. my photograph "Sunset on Mozambique Island"') },
    { name: 'prova', type: 'text', section: 'infraccao', label: l('Prova da autoria ou titularidade (opcional)', 'Proof of authorship (optional)'), placeholder: l('Ex.: ficheiro original com metadados; publicação anterior em 3 de Março de 2025', 'E.g. original file with metadata; earlier publication') },
    { name: 'usos', type: 'textarea', section: 'infraccao', rows: 3, required: true, label: l('Onde e como foi usada', 'Where and how it was used'), help: l('Uma utilização por linha, com a ligação (link), a data e o meio.', 'One use per line, with link, date and medium.') },
    { name: 'dataConhecimento', type: 'date', section: 'infraccao', width: 'half', label: l('Data em que soube', 'Date discovered') },

    { name: 'pedeRetirada', type: 'toggle', section: 'pedido', default: true, label: l('Retirar o conteúdo e não voltar a usar', 'Remove and stop using') },
    { name: 'pedeCredito', type: 'toggle', section: 'pedido', default: false, label: l('Em alternativa, regularizar com licença e crédito ao autor', 'Alternatively, regularise with a licence and credit'), showIf: (v) => v.motivo === 'obra' },
    { name: 'indemnizacao', type: 'money', section: 'pedido', width: 'half', label: l('Indemnização pedida (opcional)', 'Compensation claimed (optional)') },
    { name: 'prazoDias', type: 'number', section: 'pedido', width: 'half', min: 1, max: 60, default: 8, label: l('Prazo para cumprir (dias)', 'Days to comply') },
    { name: 'anexos', type: 'textarea', section: 'pedido', rows: 2, label: l('Anexos', 'Attachments'), default: 'Capturas de ecrã das utilizações\nProva da autoria' },

    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!linhas(v.usos).length) w.push({ level: 'error', field: 'usos', message: l('Indique onde e como foi usada a obra ou a imagem.', 'State where and how the work or image was used.') });
    w.push({ level: 'info', message: l('Guarde provas antes de enviar: capturas de ecrã com a data e a ligação. Envie por carta registada, e-mail com recibo de leitura ou pelo formulário de denúncia da plataforma.', 'Keep evidence before sending: dated screenshots with the link. Send by registered letter, e-mail with read receipt or the platform’s report form.') });
    w.push({ level: 'info', message: l(v.motivo === 'imagem' ? `O retrato não pode ser exposto ou usado comercialmente sem consentimento (${cite('digDireitoImagem')}).` : `Só o autor ou quem tenha os direitos pode autorizar a utilização da obra (${cite('digDireitosAutorTransmissao')}).`, v.motivo === 'imagem' ? 'A portrait may not be displayed or used commercially without consent.' : 'Only the author or rights holder may authorise use of the work.') });
    return w;
  },

  personName: (v) => str(v.destNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const emp = empresa(v);
    const f = !emp && isF(v.titularGenero);
    const imagem = v.motivo === 'imagem';
    const nome = str(v.titularNome) || BLANK;
    const usos = linhas(v.usos);
    const anexos = linhas(v.anexos);
    const ind = money(v.indemnizacao);
    const sal = v.destGenero === 'F' ? 'Exma. Senhora,' : v.destGenero === 'M' ? 'Exmo. Senhor,' : 'Exmos. Senhores,';
    const vos = v.destGenero === 'E' ? 'V. Ex.as' : 'V. Ex.ª';
    const qualidade = imagem ? (f ? 'na qualidade de pessoa retratada' : 'na qualidade de pessoa retratada') : emp ? 'na qualidade de titular dos direitos de autor' : `na qualidade de ${f ? 'autora e titular' : 'autor e titular'} dos direitos de autor`;
    const pedidos = [
      v.pedeRetirada ? `retirem, de todos os meios sob o vosso controlo, ${imagem ? 'as imagens' : 'a obra'} e se abstenham de ${imagem ? 'as' : 'a'} voltar a utilizar` : '',
      v.pedeCredito && !imagem ? 'ou, em alternativa, regularizem a utilização mediante licença escrita e remunerada, com a menção do nome do autor' : '',
      ind != null ? `paguem, a título de indemnização pelos danos causados, a quantia de ${valorTexto(ind)}` : '',
      'confirmem por escrito o cumprimento do presente pedido',
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: [`**${nome}**`, str(v.titularMorada), str(v.titularContacto)].filter(Boolean).join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', lines: [str(v.destNome) || BLANK, str(v.destMorada)].filter(Boolean) },
      { type: 'subject', text: imagem ? 'Utilização não autorizada de imagem — pedido de retirada' : 'Utilização não autorizada de obra protegida — pedido de cessação e retirada' },
      { type: 'salutation', text: sal },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${emp ? `A **${nome}**` : `**${nome}**`}, ${qualidade} ${imagem ? 'na' : 'sobre a'} ${semPonto(v.obra) || BLANK}${str(v.prova) ? ` (${semPonto(v.prova)})` : ''}, notifica ${vos} de que ${v.dataConhecimento ? `tomou conhecimento, em ${dateLong(v.dataConhecimento)}, de que ` : ''}${imagem ? 'a sua imagem foi utilizada' : 'a referida obra foi utilizada'}, sem a sua autorização, nos seguintes termos:`,
        en: `The sender, as ${imagem ? 'the person portrayed' : 'author or rights holder'}, notifies the recipient that the ${imagem ? 'image' : 'work'} was used without authorisation as follows:`,
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: usos.length ? usos.map((s) => semPonto(s) + '.') : [BLANK] },
      {
        type: 'paragraph',
        id: 'direito',
        text: imagem
          ? `O retrato de uma pessoa não pode ser exposto, reproduzido ou utilizado comercialmente sem o seu consentimento, nos termos do ${cite('digDireitoImagem')}, consentimento que não foi dado para estas utilizações.`
          : `A utilização de uma obra protegida depende de autorização escrita do autor ou do titular dos direitos, nos termos da ${cite('digDireitosAutorTransmissao')}, autorização que não foi dada. A utilização não autorizada constitui violação dos direitos patrimoniais e morais de autor.`,
        en: imagem ? 'A portrait may not be displayed or used commercially without consent, which was not given.' : 'Use of a protected work requires the written authorisation of the rights holder, which was not given; unauthorised use infringes economic and moral rights.',
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Assim, solicita-se que, no prazo de ${prazo(v.prazoDias)} a contar da recepção desta carta, ${vos}:`,
        en: 'The recipient is therefore asked, within the stated days of receipt, to:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: pedidos.map((s, i) => `${s}${i === pedidos.length - 1 ? '.' : ';'}`) },
      {
        type: 'paragraph',
        id: 'reserva',
        text: `Na falta de resposta satisfatória no prazo indicado, ${emp ? 'a signatária recorrerá' : f ? 'a signatária recorrerá' : 'o signatário recorrerá'} aos meios legais ao seu dispor, civis e criminais, para fazer cessar a violação e obter a reparação dos danos, sem mais aviso.`,
        en: 'Failing a satisfactory reply within the period, civil and criminal legal action will follow without further notice.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
    ];
    const col: SignatureColumn = emp
      ? { role: nome, name: str(v.representante) || undefined, image: ctx.profile?.kind === 'empresa' ? 'both' : undefined }
      : { role: imagem ? (f ? 'A Signatária' : 'O Signatário') : f ? 'A Autora' : 'O Autor', name: nome !== BLANK ? nome : undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined };
    blocks.push({ type: 'signatures', columns: [col] });
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos.map(semPonto) });
    return blocks;
  },
});
