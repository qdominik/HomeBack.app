import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { createHousehold, register } from "../actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    step?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  email_already_registered: t.auth.errors.emailAlreadyRegistered,
  household_failed: t.auth.errors.householdFailed,
  missing_fields: t.auth.errors.missingFields,
  password_too_short: t.auth.errors.passwordTooShort,
  signup_failed: t.auth.errors.signupFailed,
};

function AuthMessage({ message }: { message: string | null }) {
  return message ? (
    <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  ) : null;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userId) {
    const { data: profile } = await supabase
      .from("profile")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      redirect(routes.dashboard);
    }
  }

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.auth.errors.unknown)
    : null;

  if (!userId && params.status === "check_email") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-sm rounded-md border border-line bg-surface p-6 text-center">
          <div className="flex justify-center">
            <BrandLogo className="w-44 sm:w-52" priority variant="vertical" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">
            {t.auth.checkEmailTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {t.auth.checkEmailDescription}
          </p>
          <Link
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"
            href={routes.login}
          >
            {t.auth.backToLogin}
          </Link>
        </section>
      </main>
    );
  }

  if (userId) {
    const metadata = claimsData?.claims?.user_metadata;
    const suggestedName =
      metadata &&
      typeof metadata === "object" &&
      "imie" in metadata &&
      typeof metadata.imie === "string"
        ? metadata.imie
        : "";

    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-sm rounded-md border border-line bg-surface p-6">
          <div className="flex justify-center">
            <BrandLogo className="w-44 sm:w-52" priority variant="vertical" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">
            {t.auth.householdSetupTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t.auth.householdSetupDescription}
          </p>
          <AuthMessage message={errorMessage} />
          <form action={createHousehold} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              {t.auth.name}
              <input
                autoComplete="given-name"
                className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
                defaultValue={suggestedName}
                name="name"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              {t.auth.householdName}
              <input
                className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
                name="household_name"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              {t.auth.householdType}
              <select
                className="mt-2 h-10 w-full rounded-md border border-line bg-surface px-3 outline-none focus:border-primary"
                defaultValue="dom"
                name="household_type"
              >
                <option value="dom">{t.auth.householdTypes.house}</option>
                <option value="mieszkanie">
                  {t.auth.householdTypes.apartment}
                </option>
                <option value="garaż">{t.auth.householdTypes.garage}</option>
              </select>
            </label>
            <button
              className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-white hover:bg-primary-strong"
              type="submit"
            >
              {t.auth.createHousehold}
            </button>
          </form>
          <form action="/auth/signout" className="mt-3" method="post">
            <button
              className="h-10 w-full rounded-md border border-line text-sm font-semibold text-foreground hover:bg-surface-muted"
              type="submit"
            >
              {t.auth.signOut}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm rounded-md border border-line bg-surface p-6">
        <div className="flex justify-center">
          <BrandLogo className="w-44 sm:w-52" priority variant="vertical" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{t.auth.registerTitle}</h1>
        <AuthMessage message={errorMessage} />
        <form action={register} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            {t.auth.name}
            <input
              autoComplete="given-name"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
              name="name"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            {t.auth.email}
            <input
              autoComplete="email"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium">
            {t.auth.password}
            <input
              autoComplete="new-password"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
              minLength={8}
              name="password"
              required
              type="password"
            />
            <span className="mt-1 block text-xs font-normal text-muted">
              {t.auth.passwordHint}
            </span>
          </label>
          <button className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-white" type="submit">
            {t.auth.createAccount}
          </button>
        </form>
        <Link className="mt-4 block text-center text-sm font-medium text-primary-strong" href={routes.login}>
          {t.auth.signIn}
        </Link>
      </section>
    </main>
  );
}
