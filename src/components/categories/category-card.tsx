import {
  deleteCustomCategory,
  updateCustomCategory,
} from "@/app/(app)/categories/actions";
import { t } from "@/lib/i18n";
import type { Database } from "@/types/database";
import { CategoryForm } from "./category-form";

type Category = Database["public"]["Tables"]["category"]["Row"];

type CategoryCardProps = {
  category: Category;
  isAdmin: boolean;
};

export function CategoryCard({ category, isAdmin }: CategoryCardProps) {
  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {category.ikona ? (
              <span aria-hidden="true" className="text-xl">
                {category.ikona}
              </span>
            ) : null}
            <h2 className="text-base font-semibold text-foreground">
              {category.nazwa}
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            {category.czy_systemowa
              ? t.modules.categories.system
              : t.modules.categories.custom}
          </p>
        </div>
        {category.kolor ? (
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded border border-line"
            style={{ backgroundColor: category.kolor }}
          />
        ) : null}
      </div>
      {isAdmin && !category.czy_systemowa ? (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-2">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-primary-strong">
              {t.modules.categories.editCategory}
            </summary>
            <div className="mt-3">
              <CategoryForm
                action={updateCustomCategory}
                category={category}
                submitLabel={t.modules.categories.saveChanges}
              />
            </div>
          </details>
          <form action={deleteCustomCategory}>
            <input name="category_id" type="hidden" value={category.id} />
            <button
              className="h-9 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
              type="submit"
            >
              {t.modules.categories.deleteCategory}
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
