"use client";

import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { useFormStatus } from "react-dom";

type ItemSubmitButtonProps = {
  className: string;
  disabled?: boolean;
  icon?: "archive";
  label: string;
  pendingLabel: string;
};

export function ItemSubmitButton({
  className,
  disabled = false,
  icon,
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
      {icon === "archive" ? (
        <ArchiveIcon aria-hidden="true" className="mr-2" size={18} />
      ) : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
