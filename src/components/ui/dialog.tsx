import type { ComponentPropsWithRef } from "react";

type DialogProps = ComponentPropsWithRef<"dialog"> & {
  size?: "default" | "wide" | "large";
};

// The caller owns opening, cancellation, pending guards and focus restoration.
// Forward the native element so existing domain flows retain their lifecycle.
export function Dialog({ className, size = "default", ...props }: DialogProps) {
  return <dialog {...props} className={["ui-dialog", className].filter(Boolean).join(" ")} data-size={size} />;
}
