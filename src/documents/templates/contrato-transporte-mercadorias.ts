// Contrato de transporte rodoviário de mercadorias: shipper and licensed
// carrier. The goods travel with the seller's factura or guia de remessa
// (fiscal documents); this contract does not replace them.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, l, money } from './_shared';
import {
  arbitragemField, assinatura, clausulasFinais, documentoFields, fecho, foroField, int, lines, numerar, papel, partesBlocks, partyFields, partyWarnings,
  pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';
import { fm, num } from './_comercio';

export default defineTemplate({
  id: 'contrato-transporte-mercadorias',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'expedidor', title: l('Expedidor (quem contrata)', 'Shipper'), personRole: 'outro' },
    { id: 'transportador', title: l('Transportador', 'Carrier'), personRole: 'outro' },
    { id: 'mercadorias', title: l('Mercadorias e percurso', 'Goods and route') },
    { id: 'preco', title: l('Frete e pagamento', 'Freight and payment') },
    { id: 'outras', title: l('Responsabilidade e outras cláusulas', 'Liability and other terms') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('expedidor', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('transportador', { tipoDefault: 'empresa' }),
    {
      name: 'transportadorLicenca',
      type: 'text',
      section: 'transportador',
      width: 'half',
      label: l('Licença de transporte n.º', 'Transport licence no.'),
      legal: l('O transporte de mercadorias por conta de outrem exige licença.', 'Carrying goods for hire requires a licence.'),
    },
    { name: 'viaturas', type: 'text', section: 'transportador', width: 'half', label: l('Viatura(s) e matrícula(s)', 'Vehicle(s) and plate(s)'), placeholder: l('Ex.: Camião Scania 30 t, AFG 221 MC', 'E.g. 30 t truck, AFG 221 MC') },
    { name: 'motorista', type: 'text', section: 'transportador', label: l('Motorista e carta de condução n.º (opcional)', 'Driver and licence no. (optional)') },

    {
      name: 'tipoContrato',
      type: 'radio',
      section: 'mercadorias',
      label: l('Contrato para', 'Contract for'),
      options: [
        { value: 'viagem', label: l('Uma viagem', 'One trip') },
        { value: 'periodo', label: l('Várias viagens durante um período', 'Several trips over a period') },
      ],
      default: 'viagem',
    },
    {
      name: 'mercadorias',
      type: 'lines',
      section: 'mercadorias',
      required: true,
      label: l('Mercadorias', 'Goods'),
      addLabel: l('Adicionar mercadoria', 'Add goods'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'embalagem', type: 'text', label: l('Embalagem', 'Packaging'), placeholder: l('Ex.: sacos de 50 kg, paletes', 'E.g. 50 kg bags, pallets') },
        { name: 'quantidade', type: 'text', label: l('Quantidade / peso', 'Quantity / weight') },
        { name: 'valor', type: 'money', label: l('Valor declarado', 'Declared value') },
      ],
      default: [{ descricao: '', embalagem: '', quantidade: '', valor: '' }],
    },
    { name: 'perigosas', type: 'toggle', section: 'mercadorias', label: l('Inclui mercadorias perigosas (combustíveis, químicos, gás)', 'Includes dangerous goods') },
    { name: 'origem', type: 'text', section: 'mercadorias', width: 'half', required: true, label: l('Local de carga', 'Loading place') },
    { name: 'destino', type: 'text', section: 'mercadorias', width: 'half', required: true, label: l('Local de descarga', 'Unloading place') },
    { name: 'destinatario', type: 'text', section: 'mercadorias', label: l('Destinatário (quem recebe)', 'Consignee') },
    { name: 'dataCarga', type: 'date', section: 'mercadorias', width: 'half', label: l('Data da carga', 'Loading date') },
    { name: 'prazoEntregaDias', type: 'number', section: 'mercadorias', width: 'half', min: 1, max: 60, label: l('Prazo de entrega (dias após a carga)', 'Delivery within (days after loading)') },
    { name: 'periodoFim', type: 'date', section: 'mercadorias', width: 'half', label: l('Contrato válido até', 'Contract valid until'), showIf: (v) => v.tipoContrato === 'periodo' },
    {
      name: 'cargaPor',
      type: 'radio',
      section: 'mercadorias',
      width: 'half',
      label: l('Carga e descarga por conta de', 'Loading and unloading by'),
      options: [
        { value: 'expedidor', label: l('Expedidor / destinatário', 'Shipper / consignee') },
        { value: 'transportador', label: l('Transportador', 'Carrier') },
      ],
      default: 'expedidor',
    },
    { name: 'transfronteirico', type: 'toggle', section: 'mercadorias', label: l('Transporte para fora de Moçambique', 'Cross-border transport') },

    {
      name: 'precoModo',
      type: 'select',
      section: 'preco',
      width: 'half',
      label: l('Frete', 'Freight'),
      options: [
        { value: 'viagem', label: l('Por viagem', 'Per trip') },
        { value: 'tonelada', label: l('Por tonelada', 'Per tonne') },
        { value: 'km', label: l('Por quilómetro', 'Per km') },
      ],
      default: 'viagem',
    },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Valor do frete', 'Freight amount') },
    { name: 'ivaFrete', type: 'toggle', section: 'preco', width: 'half', default: true, label: l('Acresce IVA ao frete', 'VAT added to freight') },
    { name: 'combustivelIncluido', type: 'toggle', section: 'preco', width: 'half', default: true, label: l('Combustível, portagens e ajudas de custo incluídos', 'Fuel, tolls and allowances included') },
    { name: 'adiantamentoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 50, label: l('Adiantamento na carga (%)', 'Advance on loading (%)') },
    { name: 'prazoPagamentoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 90, default: 7, label: l('Saldo pago em (dias após a entrega)', 'Balance paid within (days after delivery)') },
    { name: 'estadiaValor', type: 'money', section: 'preco', width: 'half', label: l('Estadia por dia de espera (opcional)', 'Demurrage per day (optional)') },
    { name: 'estadiaHoras', type: 'number', section: 'preco', width: 'half', min: 1, max: 72, default: 24, label: l('Espera gratuita (horas)', 'Free waiting time (hours)') },

    { name: 'seguroMercadorias', type: 'toggle', section: 'outras', label: l('Seguro das mercadorias', 'Cargo insurance') },
    {
      name: 'seguroPor',
      type: 'radio',
      section: 'outras',
      width: 'half',
      label: l('Seguro feito por', 'Insured by'),
      options: [
        { value: 'transportador', label: l('Transportador', 'Carrier') },
        { value: 'expedidor', label: l('Expedidor', 'Shipper') },
      ],
      default: 'transportador',
      showIf: (v) => Boolean(v.seguroMercadorias),
    },
    { name: 'subcontratacao', type: 'toggle', section: 'outras', label: l('Permitir subcontratar outro transportador', 'Allow subcontracting'), help: l('Se desligado, só com autorização escrita.', 'If off, only with written consent.') },
    foroField('outras'),
    arbitragemField('outras'),
    testemunhasField('outras'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'expedidor', 'expedidor', 'shipper'), ...partyWarnings(v, 'transportador', 'transportador', 'carrier')];
    if (!str(v.transportadorLicenca)) {
      w.push({ level: 'warning', field: 'transportadorLicenca', message: l(`Confirme que o transportador tem licença para transporte de mercadorias por conta de outrem (${cite('transporteRegime')}).`, 'Check that the carrier is licensed to carry goods for hire.') });
    }
    if (money(v.preco) == null) w.push({ level: 'warning', field: 'preco', message: l('Indique o valor do frete.', 'Enter the freight amount.') });
    w.push({ level: 'info', message: l(`As mercadorias devem circular com a factura ou a guia de remessa do vendedor, emitidas em impresso autorizado ou programa certificado (${cite('facturaTipografia')}). Este contrato não substitui esses documentos.`, 'Goods must travel with the seller’s invoice or delivery note. This contract does not replace them.') });
    if (v.transfronteirico) w.push({ level: 'info', field: 'transfronteirico', message: l('O transporte internacional exige documentos aduaneiros e licenças ou autorizações próprias para circular nos países vizinhos.', 'Cross-border transport needs customs documents and permits for neighbouring countries.') });
    if (v.perigosas) w.push({ level: 'warning', field: 'perigosas', message: l('As mercadorias perigosas seguem regras especiais de embalagem, sinalização e licenciamento. Confirme-as antes da viagem.', 'Dangerous goods follow special packaging, marking and licensing rules. Check them before the trip.') });
    return w;
  },

  personName: (v) => (v.transportadorTipo === 'empresa' ? v.transportadorEmpresaNome : v.transportadorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const E = papel(v, 'expedidor', 'Expedidor', 'Expedidora');
    const T = papel(v, 'transportador', 'Transportador', 'Transportadora');
    const merc = lines(v.mercadorias).filter((m) => str(m.descricao));
    const totalDeclarado = merc.reduce((t, m) => t + (money(m.valor) ?? 0), 0);
    const prazo = int(v.prazoEntregaDias);
    const ad = num(v.adiantamentoPct);
    const pag = int(v.prazoPagamentoDias);
    const est = money(v.estadiaValor);
    const estH = int(v.estadiaHoras);
    const modo = v.precoModo === 'tonelada' ? 'por tonelada transportada' : v.precoModo === 'km' ? 'por quilómetro percorrido' : 'por viagem';
    const cargaT = v.cargaPor === 'transportador';

    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${T.O} obriga-se a transportar, por via rodoviária, as mercadorias identificadas na cláusula seguinte, de ${semPonto(v.origem) || '____________'} para ${semPonto(v.destino) || '____________'}, e a entregá-las a ${semPonto(v.destinatario) || E.o}, mediante o pagamento do frete acordado${v.tipoContrato === 'periodo' ? `, em tantas viagens quantas ${E.o} solicitar por escrito até ${dateLong(v.periodoFim)}` : ''}.`,
        en: 'The carrier will carry the goods by road from the loading place to the unloading place and deliver them to the consignee for the agreed freight.',
      },
      {
        id: 'mercadorias',
        heading: 'Mercadorias',
        text: `As mercadorias a transportar são as seguintes${totalDeclarado ? `, com o valor declarado total de ${valorTexto(totalDeclarado)}` : ''}:`,
        items: merc.length
          ? merc.map((m, i) => `${[str(m.descricao), str(m.embalagem), str(m.quantidade), money(m.valor) != null ? `valor declarado ${fm(money(m.valor))} MT` : ''].filter(Boolean).join(', ')}${i === merc.length - 1 ? '.' : ';'}`)
          : ['____________________'],
        en: 'The goods are as listed, with their declared value.',
      },
      {
        id: 'carga',
        heading: 'Carga, descarga e prazo',
        text: numerar([
          `A carga ${v.dataCarga ? `é feita em ${dateLong(v.dataCarga)}` : 'é feita na data acordada por escrito'}, por conta ${cargaT ? T.de : E.de}, e a descarga por conta ${cargaT ? T.de : 'do destinatário'}.`,
          `${T.O} confere as mercadorias à carga e regista na factura ou guia de remessa que as acompanha quaisquer reservas sobre o seu estado ou quantidade.`,
          `${T.O} entrega as mercadorias no prazo de ${quantos(prazo, 'dia', 'dias')} a contar da carga, contra assinatura do destinatário no comprovativo de recepção.`,
        ]),
        en: 'Loading and unloading as stated; the carrier checks the goods on loading and notes any reservations; delivery within the stated period against the consignee’s signature.',
      },
      {
        id: 'documentos',
        heading: 'Documentos',
        text: `As mercadorias circulam acompanhadas da factura ou da guia de remessa emitida pelo vendedor e dos demais documentos exigidos por lei. ${T.O} obriga-se a ter em ordem a licença de transporte${str(v.transportadorLicenca) ? ` n.º ${semPonto(v.transportadorLicenca)}` : ''}, os documentos da viatura${str(v.viaturas) ? ` (${semPonto(v.viaturas)})` : ''} e do motorista e o seguro obrigatório de responsabilidade civil.`,
        en: 'Goods travel with the seller’s invoice or delivery note. The carrier keeps its transport licence, vehicle and driver documents and compulsory insurance in order.',
      },
      {
        id: 'frete',
        heading: 'Frete e pagamento',
        text: numerar([
          `O frete é de ${valorTexto(money(v.preco))} ${modo}${v.ivaFrete ? ', acrescido de IVA à taxa legal' : ''}${v.combustivelIncluido ? ', incluindo combustível, portagens e ajudas de custo do motorista' : ', não incluindo combustível, portagens e ajudas de custo, que são pagos à parte contra comprovativo'}.`,
          ad ? `${E.O} paga ${pct(ad)} do frete na carga, a título de adiantamento, e o saldo no prazo de ${quantos(pag, 'dia', 'dias')} após a entrega do comprovativo de recepção assinado pelo destinatário, contra factura.` : `${E.O} paga o frete no prazo de ${quantos(pag, 'dia', 'dias')} após a entrega do comprovativo de recepção assinado pelo destinatário, contra factura.`,
          est != null ? `Se a carga ou a descarga se atrasar por facto ${E.de} ou do destinatário por mais de ${quantos(estH, 'hora', 'horas', true)}, é devida uma estadia de ${valorTexto(est)} por cada dia de espera.` : '',
        ]),
        en: 'Freight as stated (plus VAT if applicable); advance on loading and balance after delivery against the signed receipt and invoice; demurrage for delays caused by the shipper or consignee.',
      },
      {
        id: 'responsabilidade',
        heading: 'Responsabilidade',
        text: `${T.O} é responsável pela perda, avaria ou atraso na entrega das mercadorias desde a carga até à entrega, salvo caso fortuito ou de força maior, vício próprio das mercadorias ou facto ${E.de} ou do destinatário. A indemnização não excede o valor declarado das mercadorias perdidas ou avariadas.`,
        en: 'The carrier is liable for loss, damage or delay from loading to delivery, except force majeure, inherent vice or the shipper’s or consignee’s fault; compensation is capped at the declared value.',
      },
    ];
    if (v.seguroMercadorias) {
      items.push({
        id: 'seguro',
        heading: 'Seguro',
        text: `As mercadorias são seguradas contra os riscos do transporte, pelo seu valor declarado, por conta ${v.seguroPor === 'expedidor' ? E.de : T.de}, que entrega à outra parte cópia da apólice antes da carga.`,
        en: 'The goods are insured for their declared value by the party stated, who provides a copy of the policy before loading.',
      });
    }
    items.push(
      {
        id: 'destinatario',
        heading: 'Ausência ou recusa do destinatário',
        text: `Se o destinatário não for encontrado ou recusar as mercadorias, ${T.o} pede instruções ${E.ao} e guarda as mercadorias por conta e risco deste, que suporta as despesas daí resultantes.`,
        en: 'If the consignee is absent or refuses the goods, the carrier asks the shipper for instructions and keeps the goods at the shipper’s cost and risk.',
      },
      {
        id: 'subcontratacao',
        heading: 'Subcontratação',
        text: v.subcontratacao
          ? `${T.O} pode recorrer a outro transportador licenciado, mantendo-se responsável perante ${E.o} pelo cumprimento do contrato.`
          : `${T.O} não pode subcontratar o transporte sem autorização escrita ${E.de}.`,
        en: v.subcontratacao ? 'The carrier may use another licensed carrier but remains liable.' : 'The carrier may not subcontract without written consent.',
      },
      ...clausulasFinais(v),
    );

    return [
      { type: 'title', text: 'Contrato de transporte rodoviário de mercadorias' },
      ...partesBlocks(v, [
        { p: 'expedidor', role: E, en: 'shipper' },
        { p: 'transportador', role: T, en: 'carrier' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'é celebrado o presente contrato de transporte, que se rege pelas cláusulas seguintes:', en: 'This contract of carriage is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items },
      ...fecho(ctx, [assinatura(ctx, 'expedidor', E, true), assinatura(ctx, 'transportador', T)]),
    ];
  },
});
