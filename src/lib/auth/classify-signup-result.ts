export type SignupClassification =
  | "new_user_confirmation_required"
  | "existing_user"
  | "signup_error";

type SignupUser = {
  identities?: unknown;
};

type SignupResponse = {
  data?: {
    user?: SignupUser | null;
    session?: unknown | null;
  } | null;
  error?: {
    code?: string;
    message?: string;
  } | null;
};

function isAlreadyRegisteredError(error: NonNullable<SignupResponse["error"]>) {
  const code = error.code?.toLowerCase();
  const message = error.message?.toLowerCase() ?? "";

  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("user already registered")
  );
}

export function classifySignupResult({
  data,
  error,
}: SignupResponse): SignupClassification {
  if (error) {
    return isAlreadyRegisteredError(error)
      ? "existing_user"
      : "signup_error";
  }

  const user = data?.user;
  if (!user) {
    return "signup_error";
  }

  if (Array.isArray(user.identities) && user.identities.length === 0) {
    return "existing_user";
  }

  if (data?.session || Array.isArray(user.identities)) {
    return "new_user_confirmation_required";
  }

  return "signup_error";
}
