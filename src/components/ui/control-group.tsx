import type { ComponentPropsWithRef, ReactNode } from "react";

type ControlGroupProps = ComponentPropsWithRef<"fieldset"> & { legend: ReactNode };

export function ControlGroup({ legend, children, className, ...props }: ControlGroupProps) {
  return (
    <fieldset {...props} className={["min-w-0 space-y-3", className].filter(Boolean).join(" ")}>
      <legend className="ui-label">{legend}</legend>
      {children}
    </fieldset>
  );
}
