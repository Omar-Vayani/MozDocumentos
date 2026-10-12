import { registerSW } from 'virtual:pwa-register';
import i18n from '@/i18n';
import { toast } from '@/ui/misc';

export function registerPwa() {
  if (import.meta.env.DEV) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      toast(i18n.t('app.offlineReady'));
    },
  });
}
