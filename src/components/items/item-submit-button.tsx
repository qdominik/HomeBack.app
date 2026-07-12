"use client";

import { useFormStatus } from "react-dom";

type ItemSubmitButtonProps = {
  className: string;
  disabled?: boolean;
  label: string;
  pendingLabel: string;
};

export function ItemSubmitButton({
  className,
  disabled = false,
  label,
  pendingLabel,
}: ItemSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
