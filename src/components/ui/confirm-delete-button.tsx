"use client";

import type { ButtonHTMLAttributes } from "react";
import { shouldSubmitDelete } from "@/lib/confirm-delete";

type ConfirmDeleteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmationMessage: string;
};

export function ConfirmDeleteButton({
  confirmationMessage,
  disabled = false,
  onClick,
  type = "submit",
  ...props
}: ConfirmDeleteButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      type={type}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          !shouldSubmitDelete({
            confirm: (message) => window.confirm(message),
            disabled,
            message: confirmationMessage,
          })
        ) {
          event.preventDefault();
        }
      }}
    />
  );
}
