import { lazy, Suspense, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Link } from 'react-router-dom';
import { HomePage } from '@/features/catalog/HomePage';
import { Spinner } from '@/ui/misc';
import { Layout } from './Layout';

const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const EditorPage = lazy(() => import('@/features/editor/EditorPage').then((m) => ({ default: m.EditorPage })));
const GuidePage = lazy(() => import('@/features/guide/GuidePage').then((m) => ({ default: m.GuidePage })));
const ProcessPage = lazy(() => import('@/features/guide/ProcessPage').then((m) => ({ default: m.ProcessPage })));
const HistoryPage = lazy(() => import('@/features/history/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const ProfilesPage = lazy(() => import('@/features/profiles/ProfilesPage').then((m) => ({ default: m.ProfilesPage })));
const ProfileEditPage = lazy(() => import('@/features/profiles/ProfileEditPage').then((m) => ({ default: m.ProfileEditPage })));
const PeoplePage = lazy(() => import('@/features/profiles/PeoplePage').then((m) => ({ default: m.PeoplePage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('@/features/settings/AboutPage').then((m) => ({ default: m.AboutPage })));

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16 flex justify-center">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-[2rem] font-bold">{t('app.notFound')}</h1>
      <p className="mt-3">{t('app.notFoundText')}</p>
      <p className="mt-4">
        <Link to="/">{t('app.backHome')}</Link>
      </p>
    </div>
  );
}

function RouteError() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-[2rem] font-bold">{t('app.error')}</h1>
      <p className="mt-4">
        <a href="/">{t('app.backHome')}</a>
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/documentos', element: <Page><CatalogPage /></Page> },
      { path: '/documentos/:id', element: <Page><EditorPage /></Page> },
      { path: '/assistente', element: <Page><GuidePage /></Page> },
      { path: '/processos/:id', element: <Page><ProcessPage /></Page> },
      { path: '/meus-documentos', element: <Page><HistoryPage /></Page> },
      { path: '/perfis', element: <Page><ProfilesPage /></Page> },
      { path: '/perfis/novo', element: <Page><ProfileEditPage /></Page> },
      { path: '/perfis/:id', element: <Page><ProfileEditPage /></Page> },
      { path: '/pessoas', element: <Page><PeoplePage /></Page> },
      { path: '/definicoes', element: <Page><SettingsPage /></Page> },
      { path: '/sobre', element: <Page><AboutPage /></Page> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
