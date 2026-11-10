import type { ComponentPropsWithRef } from "react";

export type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  unstyled?: boolean;
};

export function Textarea({ className, unstyled = false, ...props }: TextareaProps) {
  return <textarea {...props} className={[unstyled ? null : "ui-control ui-textarea", className].filter(Boolean).join(" ") || undefined} />;
}
