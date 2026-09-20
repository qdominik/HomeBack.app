export type ConfirmationErrorCode = "confirmation_expired" | "confirmation_failed";

/** Maps Supabase callback errors to stable, non-sensitive UI states. */
export function getConfirmationError(params: URLSearchParams): ConfirmationErrorCode | null {
  const errorCode = params.get("error_code");
  const error = params.get("error");
  if (!errorCode && !error) return null;
  return errorCode === "otp_expired" ? "confirmation_expired" : "confirmation_failed";
}
