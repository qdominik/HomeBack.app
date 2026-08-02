import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TagIcon } from "@phosphor-icons/react/dist/ssr/Tag";
import { createCustomCategory } from "@/app/(app)/categories/actions";
import { CategoryCard } from "@/components/categories/category-card";
import { CategoryForm } from "@/components/categories/category-form";
import { EmptyState } from "@/components/empty-state";
import { ModulePage } from "@/components/module-page";
import { t } from "@/lib/i18n";
import { getAppContext } from "@/lib/app-context";

type CategoriesPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  action_failed: t.modules.categories.errors.actionFailed,
  admin_required: t.modules.categories.errors.adminRequired,
  category_in_use: t.modules.categories.errors.categoryInUse,
  missing_fields: t.modules.categories.errors.missingFields,
};

const statusMessages: Record<string, string> = {
  category_available: t.modules.categories.statuses.categoryAvailable,
  category_created: t.modules.categories.statuses.categoryCreated,
  category_deleted: t.modules.categories.statuses.categoryDeleted,
  category_exists: t.modules.categories.statuses.categoryExists,
  category_updated: t.modules.categories.statuses.categoryUpdated,
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const { profile, supabase } = await getAppContext();

  const { data: categoriesData } = await supabase
    .from("category")
    .select("*")
    .order("czy_systemowa", { ascending: false })
    .order("created_at", { ascending: true });

  const categories = categoriesData ?? [];
  const systemCategories = categories.filter((category) => category.czy_systemowa);
  const customCategories = categories.filter(
    (category) => !category.czy_systemowa,
  );
  const isAdmin = profile?.rola === "admin";
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.modules.categories.errors.unknown)
    : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <ModulePage
      action={
        isAdmin ? (
          <details className="w-full rounded-md border border-line bg-surface p-3 sm:w-auto sm:min-w-80">
            <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary-strong">
              <PlusIcon aria-hidden="true" size={18} weight="bold" />
              {t.modules.categories.addCategory}
            </summary>
            <div className="mt-4">
              <CategoryForm
                action={createCustomCategory}
                submitLabel={t.modules.categories.createCategory}
              />
            </div>
          </details>
        ) : null
      }
      title={t.modules.categories.title}
    >
      <section className="border-b border-line pb-5">
        {!isAdmin ? (
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
            {t.modules.categories.readOnly}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary-strong">
            {statusMessage}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {t.modules.categories.system}
        </h2>
        {systemCategories.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {systemCategories.map((category) => (
              <CategoryCard
                category={category}
                isAdmin={isAdmin}
                key={category.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<TagIcon aria-hidden="true" size={28} />} text={t.modules.categories.empty} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {t.modules.categories.custom}
        </h2>
        {customCategories.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customCategories.map((category) => (
              <CategoryCard
                category={category}
                isAdmin={isAdmin}
                key={category.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<TagIcon aria-hidden="true" size={28} />} text={t.modules.categories.empty} />
        )}
      </section>
    </ModulePage>
  );
}
