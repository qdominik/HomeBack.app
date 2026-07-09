import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function DocumentsPage() {
  return (
    <ModulePage
      action={
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white">
          {t.modules.documents.upload}
        </button>
      }
      title={t.modules.documents.title}
    >
      <EmptyState text={t.modules.documents.empty} />
    </ModulePage>
  );
}
