import { useId, type ReactNode } from "react";
import { Label } from "./label";

type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-errormessage"?: string;
};

type FieldProps = {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  describedBy?: string;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
};

export function Field({ id, label, description, error, describedBy, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hasDescription = description != null && description !== false && description !== "";
  const hasError = error != null && error !== false && error !== "";
  const descriptionId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const descriptions = [describedBy, hasDescription ? descriptionId : null, hasError ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={["min-w-0 space-y-2", className].filter(Boolean).join(" ")}>
      <Label htmlFor={controlId}>{label}</Label>
      {children({ id: controlId, "aria-describedby": descriptions || undefined, "aria-invalid": hasError ? true : undefined, "aria-errormessage": hasError ? errorId : undefined })}
      {hasDescription ? <p className="ui-field-help" id={descriptionId}>{description}</p> : null}
      {hasError ? <p className="text-sm text-danger" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
