// Autorização de uso de imagem e voz: the person photographed or filmed (or,
// for a child, the parent or guardian) authorises a named beneficiary to use
// the image, voice and name for stated purposes, media, territory and time.
// Consent to limit a personality right is revocable (Civil Code).

import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, DOC_TIPO_OPTIONS, GENERO_OPTIONS, isF, l, placeDate } from './_shared';
import { semPonto, str, valorTexto } from './_contratos';
import { entidadeTexto } from './_digital';
import { money } from './_shared';

const menor = (v: Values) => v.titular === 'menor';

const MEIOS: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'meioRedes', pt: 'Redes sociais', en: 'Social media', texto: 'redes sociais' },
  { name: 'meioSite', pt: 'Sítio na Internet', en: 'Website', texto: 'sítio na Internet' },
  { name: 'meioImpressos', pt: 'Impressos (cartazes, folhetos, revistas, relatórios)', en: 'Print (posters, leaflets, reports)', texto: 'impressos, como cartazes, folhetos, revistas e relatórios' },
  { name: 'meioTv', pt: 'Televisão, rádio e cinema', en: 'TV, radio and cinema', texto: 'televisão, rádio e cinema' },
  { name: 'meioExterior', pt: 'Publicidade exterior (outdoors)', en: 'Outdoor advertising', texto: 'publicidade exterior' },
  { name: 'meioInterno', pt: 'Uso interno (formação, arquivo)', en: 'Internal use (training, archive)', texto: 'uso interno, para formação e arquivo' },
];

export default defineTemplate({
  id: 'autorizacao-uso-imagem',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'titular', title: l('Quem autoriza', 'Who authorises'), personRole: 'outro' },
    { id: 'menorSec', title: l('Menor retratado', 'Minor portrayed') },
    { id: 'beneficiario', title: l('Quem pode usar a imagem', 'Who may use the image') },
    { id: 'ambito', title: l('Âmbito da autorização', 'Scope of the authorisation') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    {
      name: 'titular',
      type: 'radio',
      section: 'titular',
      label: l('A pessoa retratada é', 'The person portrayed is'),
      options: [
        { value: 'adulto', label: l('Maior de idade (autoriza por si)', 'An adult (signs personally)') },
        { value: 'menor', label: l('Menor (autoriza o pai, a mãe ou o tutor)', 'A minor (parent or guardian signs)') },
      ],
      default: 'adulto',
    },
    { name: 'nome', type: 'text', section: 'titular', required: true, label: l('Nome completo de quem assina', 'Full name of the signatory'), personKey: 'nome' },
    { name: 'genero', type: 'radio', section: 'titular', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'docTipo', type: 'select', section: 'titular', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'docNumero', type: 'text', section: 'titular', width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
    { name: 'contacto', type: 'tel', section: 'titular', width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone' },
    { name: 'morada', type: 'text', section: 'titular', label: l('Morada', 'Address'), personKey: 'morada' },
    {
      name: 'parentesco',
      type: 'select',
      section: 'titular',
      width: 'half',
      label: l('Relação com o menor', 'Relationship to the minor'),
      options: [
        { value: 'pai', label: l('Pai', 'Father') },
        { value: 'mae', label: l('Mãe', 'Mother') },
        { value: 'tutor', label: l('Tutor(a) ou outro representante legal', 'Guardian or other legal representative') },
      ],
      default: 'mae',
      showIf: menor,
    },

    { name: 'menorNome', type: 'text', section: 'menorSec', label: l('Nome do menor', 'Minor’s name'), showIf: menor },
    { name: 'menorGenero', type: 'radio', section: 'menorSec', width: 'half', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Menino', 'Boy') }, { value: 'F', label: l('Menina', 'Girl') }], default: 'M', showIf: menor },
    { name: 'menorNascimento', type: 'date', section: 'menorSec', width: 'half', label: l('Data de nascimento', 'Date of birth'), showIf: menor },
    { name: 'menorAssina', type: 'toggle', section: 'menorSec', default: false, label: l('O menor também assina (concordância)', 'The minor also signs (agreement)'), help: l('Recomendado para crianças mais velhas e adolescentes: a opinião da criança conta de acordo com a idade e a maturidade.', 'Recommended for older children and teenagers: the child’s view counts according to age and maturity.'), showIf: menor },

    { name: 'beneficiarioNome', type: 'text', section: 'beneficiario', label: l('Entidade ou pessoa autorizada', 'Authorised entity or person'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : c.profile?.nome || '') },
    { name: 'parceiros', type: 'text', section: 'beneficiario', label: l('Também autorizados (opcional)', 'Also authorised (optional)'), placeholder: l('Ex.: patrocinadores e parceiros do evento, apenas para divulgação do evento', 'E.g. event sponsors and partners, only to promote the event') },

    { name: 'contexto', type: 'text', section: 'ambito', required: true, label: l('Onde ou quando foram (ou serão) feitas as imagens', 'Where or when the images are taken'), placeholder: l('Ex.: sessão fotográfica de 20 de Outubro de 2026; Festival de Marrabenta 2026', 'E.g. photo shoot on 20 October 2026; festival') },
    { name: 'finalidade', type: 'text', section: 'ambito', required: true, label: l('Para que fim', 'For what purpose'), placeholder: l('Ex.: divulgação dos serviços da clínica; campanha publicitária do produto X', 'E.g. promoting the clinic’s services; ad campaign for product X') },
    { name: 'usaImagem', type: 'toggle', section: 'ambito', default: true, label: l('Imagem (fotografia e vídeo)', 'Image (photo and video)') },
    { name: 'usaVoz', type: 'toggle', section: 'ambito', default: true, label: l('Voz', 'Voice') },
    { name: 'usaNome', type: 'toggle', section: 'ambito', default: false, label: l('Nome e testemunho', 'Name and testimonial') },
    ...MEIOS.map((m, i) => ({ name: m.name, type: 'toggle' as const, section: 'ambito', default: i < 3, label: l(m.pt, m.en) })),
    { name: 'territorio', type: 'select', section: 'ambito', width: 'half', label: l('Território', 'Territory'), options: [{ value: 'mocambique', label: l('Moçambique', 'Mozambique') }, { value: 'mundo', label: l('Todo o mundo (Internet)', 'Worldwide (Internet)') }], default: 'mundo' },
    { name: 'prazoTipo', type: 'select', section: 'ambito', width: 'half', label: l('Duração', 'Duration'), options: [{ value: 'data', label: l('Até uma data', 'Until a date') }, { value: 'indeterminado', label: l('Sem prazo (revogável)', 'No end date (revocable)') }], default: 'data' },
    { name: 'prazoFim', type: 'date', section: 'ambito', width: 'half', label: l('Válida até', 'Valid until'), showIf: (v) => v.prazoTipo === 'data' },
    { name: 'edicao', type: 'toggle', section: 'ambito', default: true, label: l('Permite edição, corte e montagem (sem distorcer)', 'Allows editing and cropping (without distortion)') },
    { name: 'remunerada', type: 'toggle', section: 'ambito', default: false, label: l('Autorização remunerada', 'Paid authorisation') },
    { name: 'valor', type: 'money', section: 'ambito', width: 'half', label: l('Valor', 'Amount'), showIf: (v) => Boolean(v.remunerada) },

    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.nome)) w.push({ level: 'error', field: 'nome', message: l('Indique o nome de quem autoriza.', 'Enter the name of the person authorising.') });
    if (menor(v)) {
      const anos = ctx.legal.value<{ anos: number }>('maioridade').anos;
      w.push({ level: 'info', message: l(`Para um menor de ${anos} anos assina quem exerce o poder parental; se os pais estão separados, é prudente que assinem ambos (${cite('digImagemMenor')}).`, `For a minor under ${anos}, the person with parental authority signs; if parents are separated, it is prudent for both to sign.`) });
      if (!str(v.menorNome)) w.push({ level: 'warning', field: 'menorNome', message: l('Indique o nome do menor.', 'Enter the minor’s name.') });
    }
    if (!MEIOS.some((m) => v[m.name])) w.push({ level: 'warning', message: l('Escolha pelo menos um meio de divulgação.', 'Choose at least one medium.') });
    w.push({ level: 'info', message: l(`A autorização pode ser retirada a todo o tempo, sem efeito sobre o que já foi publicado ou impresso (${cite('digDireitoImagem')}).`, 'The authorisation can be withdrawn at any time, without effect on what was already published or printed.') });
    return w;
  },

  personName: (v) => (menor(v) ? str(v.menorNome) : str(v.nome)) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.genero);
    const m = menor(v);
    const mf = isF(v.menorGenero);
    const doMenor = mf ? 'da menor' : 'do menor';
    const doc = `${f ? 'portadora' : 'portador'} do ${v.docTipo === 'Passaporte' ? 'Passaporte' : v.docTipo === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade'} n.º ${str(v.docNumero) || BLANK}`;
    const parent = v.parentesco === 'pai' ? 'pai' : v.parentesco === 'mae' ? 'mãe' : f ? 'tutora' : 'tutor';
    const quem = [`**${str(v.nome) || BLANK}**`, doc, `residente em ${semPonto(v.morada) || BLANK}`, str(v.contacto) ? `telefone ${str(v.contacto)}` : ''].filter(Boolean).join(', ');
    const menorTxt = m ? `, na qualidade de ${parent} e ${v.parentesco === 'tutor' ? 'representante legal' : 'em exercício do poder parental'} ${doMenor} **${str(v.menorNome) || BLANK}**${v.menorNascimento ? `, ${mf ? 'nascida' : 'nascido'} em ${dateLong(v.menorNascimento)}` : ''}` : '';
    const benef = str(v.beneficiarioNome) && str(v.beneficiarioNome) !== (ctx.profile ? (ctx.profile.kind === 'empresa' ? ctx.profile.firma : ctx.profile.nome) : '') ? `**${str(v.beneficiarioNome)}**` : entidadeTexto(ctx.profile, str(v.beneficiarioNome));
    const oque = [v.usaImagem ? 'a imagem' : '', v.usaVoz ? 'a voz' : '', v.usaNome ? 'o nome e o testemunho' : ''].filter(Boolean);
    const oqueTxt = oque.length ? oque.join(oque.length > 2 ? ', ' : ' e ').replace(/, ([^,]*)$/, ' e $1') : 'a imagem';
    const dele = m ? doMenor : f ? 'da signatária' : 'do signatário';
    const meios = MEIOS.filter((x) => v[x.name]).map((x) => x.texto);
    const meiosTxt = meios.length ? meios.join('; ') : BLANK;
    const prazoTxt = v.prazoTipo === 'indeterminado' ? 'por tempo indeterminado' : `até ${dateLong(v.prazoFim)}`;

    const blocks: Block[] = [
      { type: 'title', text: 'Autorização de uso de imagem e voz', subtitle: m ? 'Menor de idade' : undefined },
      {
        type: 'paragraph',
        id: 'autoriza',
        text: `${quem}${menorTxt}, **autoriza** ${benef}${str(v.parceiros) ? ` e, ainda, ${semPonto(v.parceiros)}` : ''}, a captar, reproduzir, publicar e divulgar ${oqueTxt} ${dele}, registados em ${semPonto(v.contexto) || BLANK}, para o seguinte fim: ${semPonto(v.finalidade) || BLANK}.`,
        en: `The signatory${m ? ', as parent or guardian of the minor named,' : ''} authorises the beneficiary to capture, reproduce and publish the ${[v.usaImagem ? 'image' : '', v.usaVoz ? 'voice' : '', v.usaNome ? 'name' : ''].filter(Boolean).join(', ') || 'image'} recorded at the stated occasion, for the stated purpose.`,
      },
      {
        type: 'list',
        style: 'alpha',
        items: [
          `Meios: ${meiosTxt}.`,
          `Território: ${v.territorio === 'mocambique' ? 'Moçambique' : 'sem limite territorial, incluindo a Internet'}.`,
          `Duração: ${prazoTxt}.`,
          v.remunerada ? `Contrapartida: ${valorTexto(money(v.valor))}, que ${f ? 'a signatária' : 'o signatário'} declara receber.` : 'Contrapartida: a autorização é gratuita.',
        ],
      },
      {
        type: 'paragraph',
        id: 'condicoes',
        text: `${v.edicao ? 'As imagens e as gravações podem ser editadas, cortadas e montadas, desde que não seja alterado o seu sentido. ' : 'As imagens e as gravações não podem ser alteradas, salvo correcções técnicas. '}É proibida qualquer utilização que ofenda a honra, a reputação ou o decoro ${dele}, que ${m ? `${mf ? 'a' : 'o'} exponha a risco` : 'a exponha a ridículo'}, ou com fim diferente do indicado.${m ? ` Não é divulgada a morada nem a escola ${doMenor}.` : ''}`,
        en: `${v.edicao ? 'Editing and cropping allowed without changing meaning. ' : 'No alterations except technical corrections. '}No use that harms honour, reputation or decency, or for another purpose.${m ? ' The minor’s address and school are not disclosed.' : ''}`,
      },
      {
        type: 'paragraph',
        id: 'revogacao',
        text: `A presente autorização pode ser revogada a todo o tempo, por escrito, ficando o beneficiário obrigado a retirar as publicações que estejam sob o seu controlo e a não fazer novas utilizações, sem obrigação de recolher os materiais já impressos ou distribuídos antes da revogação.`,
        en: 'The authorisation may be withdrawn in writing at any time; the beneficiary then removes posts under its control and makes no new use, without having to recall materials already printed or distributed.',
      },
      {
        type: 'paragraph',
        id: 'dados',
        text: 'Os dados de identificação constantes deste documento destinam-se apenas a comprovar a autorização e não são divulgados.',
        en: 'The identification details are kept only as proof of the authorisation and are not disclosed.',
        keepWithNext: true,
      },
    ];
    const cols: SignatureColumn[] = [{ role: m ? (v.parentesco === 'pai' ? 'O Pai' : v.parentesco === 'mae' ? 'A Mãe' : f ? 'A Representante Legal' : 'O Representante Legal') : f ? 'A Autorizante' : 'O Autorizante', name: str(v.nome) || undefined }];
    if (m && v.menorAssina) cols.push({ role: 'Concordância do menor', name: str(v.menorNome) || undefined });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols });
    return blocks;
  },
});
