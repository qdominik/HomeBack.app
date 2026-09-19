import { AppHeader } from "@/components/app-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { login } from "../actions";
import { safeAuthReturnPath } from "@/lib/auth/return-path";

type LoginPageProps = {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
};

const errorMessages: Record<string, string> = {
  confirmation_failed: t.auth.errors.confirmationFailed,
  invalid_credentials: t.auth.errors.invalidCredentials,
  missing_fields: t.auth.errors.missingFields,
  session_expired: t.auth.errors.sessionExpired,
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeAuthReturnPath(params.next);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (claimsData?.claims?.sub) {
    if (next) redirect(next);
    const { data: profile } = await supabase
      .from("profile")
      .select("id")
      .eq("id", claimsData.claims.sub)
      .maybeSingle();

    redirect(profile ? routes.dashboard : `${routes.register}?step=household`);
  }

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? t.auth.errors.unknown)
    : null;

  return (
    <>
      <AppHeader />
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm rounded-md border border-line bg-surface p-6">
        <div className="flex justify-center">
          <BrandLogo className="w-44 sm:w-52" priority variant="vertical" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{t.auth.loginTitle}</h1>
        {errorMessage ? (
          <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        ) : null}
        <form action={login} className="mt-6 space-y-4">
          {next ? <input name="next" type="hidden" value={next} /> : null}
          <label className="block text-sm font-medium">
            {t.auth.email}
            <input
              autoComplete="email"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
              defaultValue={params.email ?? ""}
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium">
            {t.auth.password}
            <input
              autoComplete="current-password"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-primary"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-white" type="submit">
            {t.auth.signIn}
          </button>
        </form>
        <Link className="mt-4 block text-center text-sm font-medium text-primary-strong" href={next ? `${routes.register}?${new URLSearchParams({ email: params.email ?? "", next }).toString()}` : routes.register}>
          {t.auth.createAccount}
        </Link>
      </section>
    </main>
    </>
  );
}
