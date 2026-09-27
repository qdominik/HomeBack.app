"use client";

import { useActionState } from "react";
import {
  acceptInvitation,
  type AcceptInvitationState,
} from "@/app/invite/accept/actions";

const initialState: AcceptInvitationState = { error: null };

export function InvitationAcceptForm({
  buttonLabel,
  suggestedName,
}: {
  buttonLabel: string;
  suggestedName: string;
}) {
  const [state, action, pending] = useActionState(acceptInvitation, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Imię
        <input
          autoComplete="given-name"
          className="mt-2 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          defaultValue={suggestedName}
          disabled={pending}
          name="name"
          required
        />
      </label>
      {state.error ? (
        <p
          aria-live="assertive"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      <button
        className="h-11 w-full rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Przyjmowanie…" : buttonLabel}
      </button>
    </form>
  );
}
