export function formatDeleteConfirmation(
  template: string,
  name: string,
) {
  return template.replace("{name}", name);
}

type DeleteConfirmationOptions = {
  confirm: (message: string) => boolean;
  disabled?: boolean;
  message: string;
};

export function shouldSubmitDelete({
  confirm,
  disabled = false,
  message,
}: DeleteConfirmationOptions) {
  return !disabled && confirm(message);
}
