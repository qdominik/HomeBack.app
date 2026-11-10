"use client";

import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/ArrowCounterClockwise";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type ItemSubmitButtonProps = {
  className: string;
  disabled?: boolean;
  icon?: "archive" | "restore";
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
    <Button
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
      type="submit"
    >
      {icon === "archive" ? (
        <ArchiveIcon aria-hidden="true" size={18} />
      ) : null}
      {icon === "restore" ? (
        <ArrowCounterClockwiseIcon
          aria-hidden="true"
          size={18}
        />
      ) : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
