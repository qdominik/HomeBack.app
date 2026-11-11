"use client";

import { Button } from "@/components/ui/button";
import { TemplateOrCustomField } from "@/components/form/template-or-custom-field";
import { EntityIconPicker } from "@/components/icons/entity-icon-picker";
import { CATEGORY_TEMPLATE_OPTIONS } from "@/lib/categories/category-template-options";
import { normalizeCustomCategoryIconKey } from "@/lib/categories/custom-category-icon";
import { t } from "@/lib/i18n";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["category"]["Row"];

type CategoryFormProps = {
  action: (formData: FormData) => Promise<void>;
  category?: Category;
  submitLabel: string;
};

export function CategoryForm({
  action,
  category,
  submitLabel,
}: CategoryFormProps) {
  return (
    <form action={action} className="space-y-3">
      {category ? (
        <input name="category_id" type="hidden" value={category.id} />
      ) : null}
      <TemplateOrCustomField
        customLabel={t.modules.categories.fields.customName}
        defaultValue={category?.nazwa}
        helpText={t.modules.categories.fields.nameHelp}
        label={t.modules.categories.fields.name}
        name="nazwa"
        templateOptions={CATEGORY_TEMPLATE_OPTIONS}
      />
      <EntityIconPicker
        defaultValue={normalizeCustomCategoryIconKey(category?.ikona)}
        dialogTitle={t.modules.categories.iconPicker.dialogTitle}
        group="category"
        label={t.modules.categories.fields.icon}
        name="ikona"
      />
      <Button

        type="submit"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
