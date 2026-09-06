export const buttonVariants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border border-line bg-surface text-foreground hover:border-primary hover:bg-surface-muted",
  ghost: "text-primary hover:bg-primary/10 hover:text-primary-hover",
  danger: "bg-danger text-white hover:bg-danger/90",
} as const;

export const stateVariants = {
  empty: "border-dashed border-line bg-surface-muted",
  loading: "border-line bg-surface text-muted",
  error: "border-danger/30 bg-danger/5 text-danger",
} as const;
