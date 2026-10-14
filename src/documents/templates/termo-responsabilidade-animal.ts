import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { autorFields, autorSignature, autorWarnings, lowerFirst, opt, pessoaDesc, str } from './_cidadao';

const ESPECIES = [opt('cão', 'Cão', 'Dog'), opt('gato', 'Gato', 'Cat'), opt('outro', 'Outro', 'Other')];

export default defineTemplate({
  id: 'termo-responsabilidade-animal',
  family: 'declaracao',
  letterhead: false,
  sections: [
    { id: 'autor', title: l('Dono do animal', 'Owner'), personRole: 'outro' },
    { id: 'perante', title: l('Perante quem', 'Given to') },
    { id: 'animal', title: l('Animal', 'Animal') },
    { id: 'compromissos', title: l('Compromissos', 'Undertakings') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada', 'telefone'], { required: ['nome'] }),
    {
      name: 'entidade',
      type: 'text',
      section: 'perante',
      label: l('Entidade (opcional)', 'Body (optional)'),
      placeholder: l('Ex.: a Administração do Condomínio do Edifício Jardim, Maputo', 'E.g. the building’s management'),
      help: l('Escreva com o artigo: «a Administração do Condomínio…», «o senhorio, Sr. …», «o Conselho Municipal…». Deixe vazio para um termo geral.', 'Write it with the article (a/o). Leave empty for a general undertaking.'),
    },
    { name: 'especie', type: 'select', section: 'animal', width: 'half', label: l('Espécie', 'Species'), options: ESPECIES, default: 'cão' },
    { name: 'especieOutra', type: 'text', section: 'animal', width: 'half', label: l('Qual', 'Which'), showIf: (v) => v.especie === 'outro' },
    { name: 'animalNome', type: 'text', section: 'animal', width: 'half', label: l('Nome do animal', 'Animal’s name') },
    { name: 'raca', type: 'text', section: 'animal', width: 'half', label: l('Raça', 'Breed'), placeholder: l('Ex.: Pastor Alemão; sem raça definida', 'E.g. German Shepherd; mixed') },
    { name: 'sexo', type: 'radio', section: 'animal', width: 'half', label: l('Sexo', 'Sex'), options: [opt('macho', 'Macho', 'Male'), opt('fêmea', 'Fêmea', 'Female')], default: 'macho' },
    { name: 'idade', type: 'text', section: 'animal', width: 'half', label: l('Idade', 'Age'), placeholder: l('Ex.: três anos', 'E.g. three years') },
    { name: 'cor', type: 'text', section: 'animal', width: 'half', label: l('Pelagem / sinais', 'Coat / marks') },
    { name: 'registo', type: 'text', section: 'animal', width: 'half', label: l('Microchip ou registo n.º', 'Microchip or licence no.') },
    { name: 'vacina', type: 'date', section: 'animal', width: 'half', label: l('Última vacina anti-rábica', 'Last rabies vaccination') },
    { name: 'veterinario', type: 'text', section: 'animal', width: 'half', label: l('Veterinário ou clínica', 'Vet or clinic') },
    { name: 'perigosa', type: 'toggle', section: 'compromissos', default: false, label: l('Raça de grande porte ou potencialmente perigosa', 'Large or potentially dangerous breed'), help: l('Acrescenta o uso de açaime e trela curta fora de casa.', 'Adds muzzle and short lead outside the home.') },
    { name: 'outros', type: 'textarea', section: 'compromissos', rows: 2, label: l('Outros compromissos (opcional)', 'Other undertakings (optional)'), help: l('Ex.: regras do condomínio sobre elevadores e piscina. Um por linha.', 'E.g. building rules on lifts and pool. One per line.') },
    { name: 'tomeiConhecimento', type: 'toggle', section: 'documento', default: true, label: l('Espaço para a entidade assinar «tomei conhecimento»', 'Space for the body to sign “acknowledged”') },
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { doc: true, morada: true });
    if (!v.vacina && v.especie !== 'outro') w.push({ level: 'warning', field: 'vacina', message: l(`A vacinação anti-rábica de cães e gatos é obrigatória (${cite('cidAnimalVacina')}). Indique a data da última vacina e junte o boletim.`, 'Rabies vaccination of dogs and cats is compulsory; give the date and attach the record.') });
    w.push({ level: 'info', field: 'perigosa', message: l(`O dono responde pelos danos que o animal cause (${cite('cidAnimalResponsabilidade')}). Confirme no município se é exigido registo ou licença do cão.`, 'The owner is liable for damage the animal causes. Check whether the municipality requires a dog licence.') });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.autorGenero === 'F';
    const especie = v.especie === 'outro' ? lowerFirst(str(v.especieOutra)) || 'animal' : String(v.especie || 'cão');
    const cao = especie === 'cão';
    const ident = [
      { label: 'Espécie', value: especie.charAt(0).toUpperCase() + especie.slice(1) },
      { label: 'Nome', value: str(v.animalNome) || BLANK },
      { label: 'Raça', value: str(v.raca) || BLANK },
      { label: 'Sexo', value: str(v.sexo) || BLANK },
      { label: 'Idade', value: str(v.idade) || BLANK },
      { label: 'Pelagem / sinais', value: str(v.cor) || BLANK },
      { label: 'Microchip / registo', value: str(v.registo) || BLANK },
      { label: 'Vacina anti-rábica', value: v.vacina ? dateLong(v.vacina) : BLANK },
    ];
    if (str(v.veterinario)) ident.push({ label: 'Veterinário', value: str(v.veterinario) });

    const compromissos = [
      'Manter a vacinação anti-rábica e as demais vacinas e desparasitações em dia e apresentar o boletim sempre que me for pedido.',
      cao ? `Conduzir o animal pela trela${v.perigosa ? ' curta e com açaime' : ''} na via pública e nas partes comuns, e nunca o deixar circular solto ou sem vigilância.` : 'Manter o animal sob vigilância e impedir que circule sem controlo nas partes comuns e na via pública.',
      'Recolher de imediato os dejectos do animal e manter limpo o local onde vive.',
      'Evitar que o animal perturbe o descanso dos vizinhos, designadamente com latidos ou ruídos persistentes.',
      'Cumprir as regras do município e, sendo o caso, do condomínio ou do contrato de arrendamento sobre animais.',
      ...v.outros ? String(v.outros).split(/\n+/).map((s) => s.trim()).filter(Boolean).map((s) => (/[.!?]$/.test(s) ? s : `${s}.`)) : [],
    ];

    const blocks: Block[] = [
      { type: 'title', text: 'Termo de Responsabilidade', subtitle: 'Animal de companhia' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Eu, ${pessoaDesc(v, 'autor', { contactos: true })}, declaro que sou ${f ? 'a dona e a responsável' : 'o dono e o responsável'} pelo animal abaixo identificado${str(v.entidade) ? `, e assumo perante ${str(v.entidade)} os compromissos seguintes` : ', e assumo os compromissos seguintes'}.`,
        en: 'I declare that I own and am responsible for the animal identified below, and give the following undertakings.',
      },
      { type: 'keyValue', title: 'Identificação do animal', columns: 2, items: ident },
      { type: 'list', style: 'numeric', items: compromissos },
      {
        type: 'paragraph',
        id: 'responsabilidade',
        text: `Assumo inteira responsabilidade pelos danos que o animal venha a causar a pessoas, a outros animais ou a bens, nos termos do ${cite('cidAnimalResponsabilidade')}, e obrigo-me a indemnizar os lesados.`,
        en: 'I take full responsibility for any damage the animal causes to people, animals or property, and will compensate those harmed.',
        keepWithNext: true,
      },
    ];
    const cols: SignatureColumn[] = [{ ...autorSignature(ctx, 'O Responsável', 'A Responsável') }];
    if (v.tomeiConhecimento !== false && str(v.entidade)) cols.push({ role: 'Tomei conhecimento', name: undefined, detail: str(v.entidade).replace(/^(a|o|as|os)\s+/i, '').replace(/^./, (c) => c.toUpperCase()).split(',')[0] });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols });
    return blocks;
  },
});
