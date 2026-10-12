import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useL10n } from '@/app/store';
import { LAWS, LAW_IN_FORCE_SINCE } from '@/legal/mz-legal';
import { formatDateLong } from '@/lib/format';
import { PageHeader, SectionTitle } from '@/ui/misc';

export function AboutPage() {
  const { t } = useTranslation();
  const L = useL10n();
  const pt = L({ pt: 'pt', en: 'en' }) === 'pt';
  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl prose-plain">
      <PageHeader title={t('about.title')} />
      {pt ? (
        <>
          <SectionTitle>O que é este serviço</SectionTitle>
          <p>
            O Documentos MZ ajuda pequenas empresas, serviços de recursos humanos, contabilistas e particulares a preparar documentos de trabalho e
            pessoais com o conteúdo exigido pela lei moçambicana e uma apresentação profissional.
          </p>
          <p className="font-semibold">Este serviço não é oficial e não substitui aconselhamento jurídico.</p>
          <p>
            Não está associado ao Governo de Moçambique nem a qualquer ministério, instituto ou autoridade. Os modelos são um ponto de partida: leia
            o documento antes de o assinar e, em casos complexos ou de conflito, consulte um advogado, um jurista ou a inspecção do trabalho.
          </p>
          <SectionTitle className="mt-8">Os seus dados</SectionTitle>
          <p>
            Tudo é feito no seu dispositivo. Não há conta, servidor nem base de dados central, e não usamos ferramentas de análise ou de terceiros.
            Os perfis, as pessoas, os documentos e as imagens ficam guardados no navegador deste dispositivo. Se limpar os dados do navegador, perde-os
            — exporte uma cópia de segurança em <Link to="/definicoes">Definições</Link>.
          </p>
          <SectionTitle className="mt-8">Base legal</SectionTitle>
          <p>
            A legislação laboral de referência é a Lei n.º 13/2023, de 25 de Agosto (Lei do Trabalho), em vigor desde {formatDateLong(LAW_IN_FORCE_SINCE)}, que revogou a
            Lei n.º 23/2007. Factos ocorridos antes dessa data podem ainda seguir a lei anterior.
          </p>
          <p>
            Prazos, taxas e referências a artigos estão num único ficheiro de configuração, com a fonte e a data de verificação de cada valor. Os valores
            marcados «Confirme este valor» precisam de confirmação. As taxas do INSS, a tabela de IRPS e os salários mínimos podem ser ajustados em
            Definições.
          </p>
        </>
      ) : (
        <>
          <SectionTitle>What this service is</SectionTitle>
          <p>
            Documentos MZ helps small businesses, HR staff, accountants and individuals prepare employment and personal documents with the content
            required by Mozambican law and a professional layout.
          </p>
          <p className="font-semibold">This is not an official service and does not replace legal advice.</p>
          <p>
            It is not associated with the Government of Mozambique or any ministry, institute or authority. Templates are a starting point: read the
            document before signing it and, in complex or contested cases, consult a lawyer or the labour inspectorate.
          </p>
          <SectionTitle className="mt-8">Your data</SectionTitle>
          <p>
            Everything happens on your device. There is no account, server or central database, and no analytics or third-party scripts. Profiles,
            people, documents and images are stored in this device’s browser. If you clear browser data you lose them — export a backup in{' '}
            <Link to="/definicoes">Settings</Link>.
          </p>
          <SectionTitle className="mt-8">Legal basis</SectionTitle>
          <p>
            The reference labour legislation is Law 13/2023 of 25 August (Labour Law), in force since {LAW_IN_FORCE_SINCE}, which revoked Law 23/2007.
            Facts before that date may still follow the previous law. Generated documents are always in Portuguese, Mozambique’s official language.
          </p>
        </>
      )}
      <SectionTitle className="mt-8">{pt ? 'Fontes' : 'Sources'}</SectionTitle>
      <ul className="list-disc pl-6 space-y-1">
        {Object.values(LAWS).map((l) => (
          <li key={l.title}>{l.url ? <a href={l.url} target="_blank" rel="noreferrer">{l.title}</a> : l.title}</li>
        ))}
      </ul>
    </div>
  );
}
