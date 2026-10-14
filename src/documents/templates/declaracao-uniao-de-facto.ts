// Declaração conjunta de união de facto: the partners declare their life in
// common to request the administrative certificate of de facto union.

import { diffDays, formatMonthYear } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, lineItems, localField, placeDate } from './_shared';
import { deEntidade, identificacao, notaryBox, pessoaFields, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

const fem = (v: Record<string, unknown>, p: string) => isF(v[`${p}Genero`]);

export default defineTemplate({
  id: 'declaracao-uniao-de-facto',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'companheiro1', title: l('Primeiro declarante', 'First partner'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'companheiro2', title: l('Segundo declarante', 'Second partner'), personRole: 'outro' },
    { id: 'uniao', title: l('Vida em comum', 'Life together') },
    { id: 'testemunhas', title: l('Testemunhas (opcional)', 'Witnesses (optional)') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da declaração', 'Date of the declaration')),
    ...pessoaFields('companheiro1', 'companheiro1', { profile: true, keys: ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit'] }),
    ...pessoaFields('companheiro2', 'companheiro2', { keys: ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit'] }).map((f) =>
      f.name === 'companheiro2Genero' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'M' : 'F') } : f,
    ),
    {
      name: 'moradaComum',
      type: 'text',
      section: 'uniao',
      required: true,
      label: l('Residência comum', 'Shared address'),
      placeholder: l('Ex.: Bairro de Malhangalene, Rua da Resistência, n.º 512, Maputo', 'E.g. full address'),
      default: (c) => {
        const m = c.profile?.kind === 'pessoa' ? c.profile.morada : undefined;
        return m ? [m.rua, m.numero ? `n.º ${m.numero}` : '', m.bairro, m.cidade].filter(Boolean).join(', ') : '';
      },
    },
    {
      name: 'inicioUniao',
      type: 'month',
      section: 'uniao',
      width: 'half',
      required: true,
      label: l('Vivem juntos desde', 'Living together since'),
      legal: l('A lei exige vida em comum ininterrupta por um período mínimo.', 'The law requires a minimum period of uninterrupted life together.'),
    },
    {
      name: 'filhos',
      type: 'lines',
      section: 'uniao',
      label: l('Filhos em comum (opcional)', 'Children together (optional)'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      ],
      default: [],
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'uniao',
      label: l('Entidade a quem se destina (opcional)', 'Receiving authority (optional)'),
      placeholder: l('Ex.: Administração do Distrito Municipal KaMpfumo', 'E.g. district administration'),
      help: l('O reconhecimento administrativo é pedido à autoridade administrativa da área de residência.', 'Administrative recognition is requested from the local administrative authority.'),
    },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'testemunhas',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      help: l('Duas testemunhas que conhecem a vida em comum do casal. Útil se o reconhecimento seguir para tribunal.', 'Two witnesses who know the couple’s life together. Useful if recognition goes to court.'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'documento', type: 'text', label: l('BI n.º', 'ID no.') },
        { name: 'morada', type: 'text', label: l('Residência', 'Address') },
      ],
      default: [],
    },
    RECONHECIMENTO_FIELD('opcoes'),
  ],

  computed: (v, ctx) => {
    const inicio = typeof v.inicioUniao === 'string' && v.inicioUniao ? `${v.inicioUniao}-01` : '';
    const dias = inicio ? diffDays(inicio, v.data || ctx.today) : NaN;
    const anos = Number.isFinite(dias) ? Math.floor(dias / 365.25) : null;
    return {
      anos,
      dias: Number.isFinite(dias) ? dias : null,
      filhos: lineItems(v.filhos).filter((r) => str(r.nome)),
      testemunhas: lineItems(v.testemunhas).filter((r) => str(r.nome)).slice(0, 2),
    };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const min = ctx.legal.value<{ anosMin: number }>('uniaoFactoNocao').anosMin;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          'Junte cópias dos documentos de identificação, as certidões de nascimento e o atestado de residência que mostre o tempo de vida em comum. A autoridade administrativa emite depois o certificado de união de facto.',
          'Attach copies of both IDs, birth certificates and a proof of residence showing how long you have lived together. The administrative authority then issues the certificate.',
        ),
      },
      {
        level: 'info',
        message: l(
          'A união de facto não altera o estado civil nem cria regime de bens de casamento. Produz efeitos patrimoniais e sucessórios quando reconhecida. A falsidade das declarações é punida por lei.',
          'A de facto union does not change marital status or create a marital property regime. It has property and inheritance effects once recognised. False statements are punishable.',
        ),
      },
    ];
    if (c.dias != null && c.dias <= min * 365.25) {
      w.push({
        level: 'warning',
        field: 'inicioUniao',
        message: l(
          `A lei exige comunhão de vida ininterrupta há mais de ${min} anos (${cite('uniaoFactoNocao')}). Pela data indicada, esse prazo ainda não está cumprido.`,
          `The law requires more than ${min} years of uninterrupted life together. By the date given, that period is not yet complete.`,
        ),
      });
    }
    if (c.dias != null && c.dias < 0) w.push({ level: 'error', field: 'inicioUniao', message: l('A data de início é posterior à data da declaração.', 'The start date is after the declaration date.') });
    for (const p of ['companheiro1', 'companheiro2']) {
      if (v[`${p}EstadoCivil`] === 'casado') {
        w.push({
          level: 'error',
          field: `${p}EstadoCivil`,
          message: l('Uma pessoa casada não pode viver em união de facto reconhecida: há impedimento para casar.', 'A married person cannot be in a recognised de facto union: there is an impediment to marriage.'),
        });
      }
      if (!str(v[`${p}DocNumero`])) w.push({ level: 'warning', field: `${p}DocNumero`, message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
    }
    if (v.companheiro1Genero && v.companheiro1Genero === v.companheiro2Genero) {
      w.push({
        level: 'warning',
        field: 'companheiro2Genero',
        message: l('A lei define a união de facto como a ligação entre um homem e uma mulher.', 'The law defines a de facto union as between a man and a woman.'),
      });
    }
    return w;
  },

  personName: (v) => v.companheiro1Nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const desde = formatMonthYear(v.inicioUniao ? `${v.inicioUniao}-01` : '');
    const morada = str(v.moradaComum) || BLANK;
    const ambosF = fem(v, 'companheiro1') && fem(v, 'companheiro2');
    const os = ambosF ? 'as declarantes' : 'os declarantes';
    const entidade = str(v.entidade);

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração Conjunta de União de Facto' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${identificacao(v, 'companheiro1', { morada: false })}, e ${identificacao(v, 'companheiro2', { morada: false })}, ${ambosF ? 'ambas' : 'ambos'} residentes em ${morada}, **declaram, sob compromisso de honra**, que vivem em união de facto, em comunhão plena de vida, de forma ininterrupta, desde ${desde}${c.anos != null && c.anos >= 1 ? `, há mais de ${c.anos} ${c.anos === 1 ? 'ano' : 'anos'}` : ''}, na residência comum acima indicada.`,
        en: `The two people identified above, living at the stated address, declare on their honour that they have lived together in a de facto union, sharing their lives without interruption, since ${v.inicioUniao || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'impedimentos',
        text: `Declaram ainda que ${ambosF ? 'nenhuma delas é casada' : 'nenhum deles é casado'} nem vive em outra união de facto e que não existe entre ${ambosF ? 'elas' : 'eles'} impedimento legal para contrair casamento.`,
        en: 'They also declare that neither is married or in another de facto union, and that there is no legal impediment to their marrying.',
      },
    ];
    if (c.filhos.length) {
      const nomes = c.filhos.map((f: Record<string, string>) => `${str(f.nome)}${f.nascimento ? `${c.filhos.length === 1 ? ',' : ''} em ${dateLong(f.nascimento)}` : ''}`);
      const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0];
      blocks.push({ type: 'paragraph', id: 'filhos', text: `Da sua união ${c.filhos.length === 1 ? 'nasceu' : 'nasceram'} ${lista}.`, en: 'Their children are as named.' });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'finalidade',
        text: `A presente declaração destina-se a instruir o pedido de reconhecimento da união de facto${entidade ? ` junto ${deEntidade(entidade)}` : ' junto da autoridade administrativa competente'}, nos termos da ${cite('uniaoFactoReconhecimento')}.`,
        en: 'This declaration supports the application for recognition of the de facto union under the Family Law.',
      },
      {
        type: 'paragraph',
        id: 'responsabilidade',
        text: `${os.charAt(0).toUpperCase()}${os.slice(1)} têm conhecimento de que a prestação de falsas declarações ${ambosF ? 'as' : 'os'} faz incorrer em responsabilidade criminal.`,
        en: 'The declarants are aware that false statements carry criminal liability.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade, ${os} assinam a presente declaração.`,
        en: 'In witness whereof, the declarants sign this declaration.',
        keepWithNext: true,
      },
    );
    const sig = (p: string): SignatureColumn => ({
      role: fem(v, p) ? 'A Declarante' : 'O Declarante',
      name: str(v[`${p}Nome`]) || undefined,
      detail: str(v[`${p}DocNumero`]) ? `${str(v[`${p}DocTipo`]) || 'BI'} n.º ${str(v[`${p}DocNumero`])}` : undefined,
    });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [sig('companheiro1'), sig('companheiro2')] });
    if (c.testemunhas.length) {
      blocks.push({
        type: 'signatures',
        columns: c.testemunhas.map((t: Record<string, string>, i: number) => ({
          role: `${i + 1}.ª Testemunha`,
          name: str(t.nome) || undefined,
          detail: [str(t.documento) ? `BI n.º ${str(t.documento)}` : '', str(t.morada)].filter(Boolean).join(' · ') || undefined,
        })),
      });
    }
    blocks.push({
      type: 'note',
      text: '**Anexos:** cópias dos documentos de identificação e certidões de nascimento dos declarantes; atestado de residência com indicação do tempo de vida em comum.',
      en: 'Attachments: copies of both IDs and birth certificates; proof of residence showing the time lived together.',
    });
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
