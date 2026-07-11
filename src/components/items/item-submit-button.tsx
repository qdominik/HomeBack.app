"use client";

import { useFormStatus } from "react-dom";

type ItemSubmitButtonProps = {
  className: string;
  label: string;
  pendingLabel: string;
};

export function ItemSubmitButton({
  className,
  label,
  pendingLabel,
}: ItemSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
