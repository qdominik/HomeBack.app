"use client";

import { useFormStatus } from "react-dom";
import { generateTestData } from "@/app/(app)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { ReactNode } from "react";

type DatasetOption = {
  type: "qa_smoke" | "small" | "medium" | "deletion_test";
  label: string;
  description: string;
  color: "primary" | "secondary" | "danger";
  submitLabel?: string;
};

const datasets: DatasetOption[] = [
  {
    type: "qa_smoke",
    label: t.modules.settings.testDataTabs.qaSmoke,
    description: t.modules.settings.testDataDescriptions.qaSmoke,
    color: "primary",
    submitLabel: t.modules.settings.generateQa,
  },
  {
    type: "small",
    label: t.modules.settings.testDataTabs.small,
    description: t.modules.settings.testDataDescriptions.small,
    color: "primary",
  },
  {
    type: "medium",
    label: t.modules.settings.testDataTabs.medium,
    description: t.modules.settings.testDataDescriptions.medium,
    color: "secondary",
  },
  {
    type: "deletion_test",
    label: t.modules.settings.testDataTabs.deletion,
    description: t.modules.settings.testDataDescriptions.deletion,
    color: "danger",
  },
];

function SubmitButton({
  label,
  loadingLabel,
}: {
  label: string;
  loadingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={buttonClassName({ variant: "primary" })}
      disabled={pending}
      type="submit"
    >
      {pending ? loadingLabel : label}
    </button>
  );
}

export function TestDataGuard({ children }: { children: ReactNode }) {
  return (
    <Alert variant="warning">{children}</Alert>
  );
}

export function TestDataContent() {
  return (
    <div className="space-y-6">
      <p className="rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-sm leading-6 text-foreground">
        {t.modules.settings.envGuard}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {datasets.map((dataset) => (
          <form
            action={generateTestData}
            key={dataset.type}
            className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4"
          >
            <input name="dataset_type" type="hidden" value={dataset.type} />
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold">{dataset.label}</h3>
              <p className="text-sm text-muted">{dataset.description}</p>
            </div>
            <SubmitButton
              label={dataset.submitLabel ?? t.modules.settings.generate}
              loadingLabel={t.modules.settings.generating}
            />
          </form>
        ))}
      </div>
    </div>
  );
}
