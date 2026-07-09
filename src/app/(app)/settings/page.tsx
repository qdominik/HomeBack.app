import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";

const settingsSections = [
  t.modules.settings.household,
  t.modules.settings.account,
  t.modules.settings.export,
];

export default function SettingsPage() {
  return (
    <ModulePage title={t.modules.settings.title}>
      <section className="grid gap-4 md:grid-cols-3">
        {settingsSections.map((section) => (
          <div className="rounded-md border border-line bg-surface p-4" key={section}>
            <h2 className="text-base font-semibold">{section}</h2>
          </div>
        ))}
      </section>
    </ModulePage>
  );
}
