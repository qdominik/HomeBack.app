import { FilePlusIcon } from "@phosphor-icons/react/dist/ssr/FilePlus";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

export default function DocumentsPage() {
  return (
    <ModulePage
      action={
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
          <FilePlusIcon aria-hidden="true" size={18} weight="bold" />
          {t.modules.documents.upload}
        </button>
      }
      title={t.modules.documents.title}
    >
      <EmptyState icon={<FileTextIcon aria-hidden="true" size={28} />} text={t.modules.documents.empty} />
    </ModulePage>
  );
}
