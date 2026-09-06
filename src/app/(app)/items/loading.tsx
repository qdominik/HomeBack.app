import { t } from "@/lib/i18n";
import { LoadingState } from "@/components/ui/loading-state";

export default function ItemsLoading() {
  return <LoadingState>{t.modules.items.loading}</LoadingState>;
}
