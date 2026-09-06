export const uiTokens = {
  cardContent: "p-5 sm:p-6",
  mutedText: "text-sm leading-6 text-muted",
  control: "ui-control",
  fieldLabel: "ui-label",
  fieldHelp: "ui-field-help",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
} as const;

export const uiTokenValues = {
  controlHeight: "2.75rem",
  radius: "0.5rem",
  spacing: ["0.25rem", "0.5rem", "0.75rem", "1rem", "1.25rem", "1.5rem", "2rem", "2.5rem"],
} as const;
