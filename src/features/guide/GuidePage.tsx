// GOV.UK-style assistant: one question per screen. The path of answers lives in
// the URL (?r=empresa/disciplinar), so the browser back button always works and
// previous answers are kept.

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useL10n } from '@/app/store';
import { getMeta } from '@/features/catalog/catalog';
import { Button, ButtonLink } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { processById } from './processes';
import { walk } from './tree';

export function GuidePage() {
  const { t } = useTranslation();
  const L = useL10n();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const path = (sp.get('r') ?? '').split('/').filter(Boolean);
  const { nodes, result, valid } = walk(path);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [sp]);

  useEffect(() => {
    if (!valid) navigate('/assistente', { replace: true });
  }, [valid, navigate]);

  const go = (next: string[]) => navigate(next.length ? `/assistente?r=${next.join('/')}` : '/assistente');
  const back = () => go(path.slice(0, -1));

  if (result) {
    const meta = getMeta(result.doc);
    const process = result.process ? processById(result.process) : undefined;
    return (
      <div className="container-page py-8 sm:py-10 max-w-3xl">
        <Button variant="quiet" onClick={back} icon="chevronLeft" className="-ml-1 mb-4">
          {t('guide.back')}
        </Button>
        <div className="border-[5px] border-primary p-5 sm:p-7">
          <p className="text-muted font-semibold">{t('guide.result')}</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[1.9rem] sm:text-[2.3rem] font-bold mt-1 focus:outline-none">
            {meta ? L(meta.title) : result.doc}
          </h1>
          {meta ? <p className="text-[1.1rem] text-muted mt-1">{meta.formalTitle}</p> : null}
          <h2 className="font-bold mt-5">{t('guide.why')}</h2>
          <p className="mt-1 text-[1.05rem]">{L(result.why)}</p>
          <ButtonLink to={`/documentos/${result.doc}`} className="mt-6" iconRight="arrowRight">
            {t('guide.start')}
          </ButtonLink>
        </div>

        {process ? (
          <div className="mt-8 p-5 bg-surface border-l-[6px] border-link">
            <h2 className="text-[1.2rem] font-bold">{t('guide.process')}</h2>
            <p className="mt-1">{L(process.summary)}</p>
            <ol className="mt-3 list-decimal pl-6 space-y-1">
              {process.steps.map((s) => (
                <li key={s.id}>{L(s.title)}</li>
              ))}
            </ol>
            <ButtonLink to={`/processos/${process.id}`} variant="secondary" className="mt-4" iconRight="arrowRight">
              {t('guide.seeProcess')}
            </ButtonLink>
          </div>
        ) : null}

        {result.also?.length ? (
          <div className="mt-8">
            <h2 className="text-[1.2rem] font-bold">{t('guide.alsoUseful')}</h2>
            <ul className="mt-2 space-y-2">
              {result.also.map((id) => {
                const m = getMeta(id);
                return m ? (
                  <li key={id}>
                    <Link to={`/documentos/${id}`}>{L(m.title)}</Link>
                    <span className="text-muted"> — {m.formalTitle}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/assistente">{t('guide.restart')}</Link>
          <Link to="/documentos">{t('guide.browse')}</Link>
        </div>
      </div>
    );
  }

  const node = nodes[nodes.length - 1];
  return (
    <div className="container-page py-8 sm:py-10 max-w-3xl">
      {path.length > 0 ? (
        <Button variant="quiet" onClick={back} icon="chevronLeft" className="-ml-1 mb-4">
          {t('guide.back')}
        </Button>
      ) : (
        <p className="text-muted mb-2">{t('guide.intro')}</p>
      )}
      <p className="text-muted font-semibold">{t('guide.step', { n: path.length + 1 })}</p>
      <h1 ref={headingRef} tabIndex={-1} className="text-[1.9rem] sm:text-[2.4rem] font-bold mt-1 mb-6 focus:outline-none">
        {L(node.question)}
      </h1>
      {node.hint ? <p className="text-muted -mt-4 mb-6">{L(node.hint)}</p> : null}
      <ul className="grid gap-3">
        {node.options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => go([...path, o.id])}
              className="w-full text-left min-h-16 px-4 py-3 border-2 border-border-strong rounded-[var(--radius)] bg-bg hover:bg-surface flex items-center gap-3 cursor-pointer
                shadow-[0_2px_0_0_var(--border)] active:translate-y-[1px] active:shadow-none"
            >
              <span className="flex-1">
                <span className="block font-bold text-[1.1rem] leading-snug">{L(o.label)}</span>
                {o.hint ? <span className="block text-muted mt-0.5 leading-snug">{L(o.hint)}</span> : null}
              </span>
              <Icon name="chevronRight" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <h2 className="font-bold">{t('guide.notFound')}</h2>
        <p className="mt-1">
          <Link to="/documentos">{t('guide.browse')}</Link>
        </p>
      </div>
    </div>
  );
}
