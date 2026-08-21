export type IconSearchTheme = {
  id: string;
  tokens: Readonly<Record<string, readonly string[]>>;
};

export type IconSearchLocalePack = {
  locale: string;
  iconAliases: Readonly<Record<string, readonly string[]>>;
  tokenAliases: Readonly<Record<string, readonly string[]>>;
  themes?: readonly IconSearchTheme[];
};
