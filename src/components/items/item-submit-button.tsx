"use client";

import { ArchiveIcon } from "@phosphor-icons/react/Archive";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/ArrowCounterClockwise";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";

type ItemSubmitButtonProps = {
  className?: string;
  disabled?: boolean;
  icon?: "archive" | "restore";
  label: string;
  pendingLabel: string;
  size?: "default" | "icon";
  variant?: ButtonVariant;
};

export function ItemSubmitButton({
  className,
  disabled = false,
  icon,
  label,
  pendingLabel,
  size = "default",
  variant,
}: ItemSubmitButtonProps) {
  const { pending } = useFormStatus();
  const currentLabel = pending ? pendingLabel : label;

  return (
    <Button
      aria-label={size === "icon" ? currentLabel : undefined}
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
      size={size}
      type="submit"
      variant={variant}
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
      {size === "default" ? currentLabel : null}
    </Button>
  );
}
