import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OWNER } from '@/app/owner';
import { usePrefs } from '@/app/store';
import { PageHeader } from '@/ui/misc';

const UPDATED = '2026-10-12';

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[1.25rem] font-bold">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Contact({ pt }: { pt: boolean }) {
  return OWNER.contactEmail ? (
    <p>
      {pt ? 'Contacto: ' : 'Contact: '}
      <a href={`mailto:${OWNER.contactEmail}`}>{OWNER.contactEmail}</a>
    </p>
  ) : null;
}

export function TermsPage() {
  const pt = usePrefs((s) => s.lang) === 'pt';
  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl">
      <PageHeader title={pt ? 'Termos de utilização' : 'Terms of use'} intro={pt ? `Última actualização: 12 de Outubro de 2026.` : `Last updated: ${UPDATED}.`} />
      {pt ? (
        <>
          <Section n={1} title="Titularidade">
            <p>
              O {OWNER.product} — incluindo o software, o design, os modelos de documentos, a redacção dos modelos, os dados de referência legal, a
              documentação, o nome e o logótipo — é propriedade exclusiva de {OWNER.name}. Todos os direitos reservados.
            </p>
          </Section>
          <Section n={2} title="Licença de utilização">
            <p>
              É concedida ao utilizador uma licença pessoal, não exclusiva e intransmissível para usar a aplicação na criação de documentos para uso
              próprio ou da sua empresa. Os documentos que o utilizador cria são seus e pode usá-los livremente.
            </p>
            <p>Sem autorização escrita de {OWNER.name}, não é permitido:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>copiar, reproduzir, modificar ou distribuir o software ou os modelos, total ou parcialmente;</li>
              <li>vender, revender, alugar ou disponibilizar a terceiros os modelos ou a aplicação como produto ou serviço;</li>
              <li>fazer engenharia inversa ou descompilar o software, salvo quando a lei o permita expressamente;</li>
              <li>usar a aplicação ou os modelos para criar um produto ou serviço concorrente;</li>
              <li>remover avisos de direitos de autor ou de marca.</li>
            </ul>
          </Section>
          <Section n={3} title="Não é aconselhamento jurídico nem serviço oficial">
            <p>
              A aplicação ajuda a preparar documentos com base na legislação moçambicana, mas não presta aconselhamento jurídico e não substitui um
              advogado, jurista ou a inspecção do trabalho. Não é um serviço do Estado nem está associada a qualquer entidade pública.
            </p>
            <p>
              A lei muda e cada caso tem particularidades. O utilizador é responsável por ler, confirmar e adaptar cada documento antes de o assinar ou
              entregar. Os valores marcados «Confirme este valor» devem ser confirmados junto da entidade competente.
            </p>
          </Section>
          <Section n={4} title="Limitação de responsabilidade">
            <p>
              Na medida máxima permitida por lei, {OWNER.name} não responde por danos indirectos, lucros cessantes ou prejuízos resultantes da
              utilização dos documentos criados, de erros de preenchimento ou de alterações legislativas. A aplicação é fornecida «tal como está».
            </p>
          </Section>
          <Section n={5} title="Os seus dados">
            <p>
              Os dados ficam guardados apenas no dispositivo do utilizador, que é responsável por fazer cópias de segurança. Ver a{' '}
              <Link to="/privacidade">Política de privacidade</Link>.
            </p>
          </Section>
          <Section n={6} title="Planos e preços">
            <p>
              Algumas funcionalidades podem passar a estar disponíveis mediante pagamento ou subscrição. As condições de cada plano são apresentadas
              antes da compra. Estes termos podem ser actualizados; a versão em vigor é a publicada nesta página.
            </p>
          </Section>
          <Section n={7} title="Lei aplicável e foro">
            <p>
              Estes termos regem-se pela lei da República de Moçambique. Para qualquer litígio é competente o foro da Cidade de Maputo, salvo norma
              legal imperativa em contrário.
            </p>
            <Contact pt />
          </Section>
        </>
      ) : (
        <>
          <Section n={1} title="Ownership">
            <p>
              {OWNER.product} — including the software, design, document templates and their wording, legal reference data, documentation, name and
              logo — is the exclusive property of {OWNER.name}. All rights reserved.
            </p>
          </Section>
          <Section n={2} title="Licence to use">
            <p>
              You get a personal, non-exclusive, non-transferable licence to use the app to create documents for yourself or your business. The
              documents you create are yours to use freely.
            </p>
            <p>Without written permission from {OWNER.name}, you may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>copy, reproduce, modify or distribute the software or the templates, in whole or in part;</li>
              <li>sell, resell, rent or offer the templates or the app to others as a product or service;</li>
              <li>reverse engineer or decompile the software, except where the law expressly allows it;</li>
              <li>use the app or templates to build a competing product or service;</li>
              <li>remove copyright or trademark notices.</li>
            </ul>
          </Section>
          <Section n={3} title="Not legal advice, not an official service">
            <p>
              The app helps prepare documents based on Mozambican law but does not give legal advice and does not replace a lawyer or the labour
              inspectorate. It is not a government service and is not associated with any public body.
            </p>
            <p>Laws change and every case is different. You are responsible for reading, checking and adapting each document before signing or delivering it.</p>
          </Section>
          <Section n={4} title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, {OWNER.name} is not liable for indirect damages, lost profits or losses arising from the use of
              documents created, from data entry errors or from changes in the law. The app is provided “as is”.
            </p>
          </Section>
          <Section n={5} title="Your data">
            <p>
              Data is stored only on your device and you are responsible for backups. See the <Link to="/privacidade">Privacy policy</Link>.
            </p>
          </Section>
          <Section n={6} title="Plans and pricing">
            <p>Some features may become available for a fee or subscription. The conditions of each plan are shown before purchase. These terms may be updated; the version in force is the one published here.</p>
          </Section>
          <Section n={7} title="Governing law">
            <p>These terms are governed by the law of the Republic of Mozambique. The courts of Maputo City have jurisdiction, unless mandatory law provides otherwise.</p>
            <Contact pt={false} />
          </Section>
        </>
      )}
    </div>
  );
}

export function PrivacyPage() {
  const pt = usePrefs((s) => s.lang) === 'pt';
  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl">
      <PageHeader title={pt ? 'Política de privacidade' : 'Privacy policy'} intro={pt ? 'Última actualização: 12 de Outubro de 2026.' : `Last updated: ${UPDATED}.`} />
      {pt ? (
        <>
          <Section n={1} title="O que recolhemos">
            <p>
              Nada. A aplicação funciona no seu navegador. Os perfis, as pessoas, os documentos, as imagens (logótipo, assinatura, carimbo) e as
              definições ficam guardados apenas neste dispositivo e não são enviados para nenhum servidor de {OWNER.name}.
            </p>
          </Section>
          <Section n={2} title="Sem contas, análise ou publicidade">
            <p>Não há registo de conta, ferramentas de análise, cookies de publicidade nem scripts de terceiros.</p>
          </Section>
          <Section n={3} title="Partilha">
            <p>
              Um documento só sai do dispositivo quando o utilizador o descarrega, imprime ou partilha (por exemplo, pelo WhatsApp). Nesse caso aplicam-se
              as regras do serviço escolhido.
            </p>
          </Section>
          <Section n={4} title="Dados de terceiros">
            <p>
              Ao registar dados de trabalhadores, clientes ou outras pessoas, o utilizador é responsável por tratá-los de forma lícita, guardá-los com
              cuidado e apagá-los quando deixarem de ser necessários.
            </p>
          </Section>
          <Section n={5} title="Apagar os dados">
            <p>
              Pode apagar tudo em <Link to="/definicoes">Definições</Link> → «Apagar todos os dados», ou limpando os dados do site no navegador.
            </p>
            <Contact pt />
          </Section>
        </>
      ) : (
        <>
          <Section n={1} title="What we collect">
            <p>
              Nothing. The app runs in your browser. Profiles, people, documents, images (logo, signature, stamp) and settings are stored only on this
              device and are never sent to any server of {OWNER.name}.
            </p>
          </Section>
          <Section n={2} title="No accounts, analytics or ads">
            <p>There is no account, analytics, advertising cookies or third-party scripts.</p>
          </Section>
          <Section n={3} title="Sharing">
            <p>A document leaves the device only when you download, print or share it (for example on WhatsApp). The chosen service’s rules then apply.</p>
          </Section>
          <Section n={4} title="Other people’s data">
            <p>When you record data about employees, clients or others, you are responsible for handling it lawfully, keeping it safe and deleting it when no longer needed.</p>
          </Section>
          <Section n={5} title="Deleting data">
            <p>
              Delete everything in <Link to="/definicoes">Settings</Link> → “Delete all data”, or by clearing site data in your browser.
            </p>
            <Contact pt={false} />
          </Section>
        </>
      )}
    </div>
  );
}
