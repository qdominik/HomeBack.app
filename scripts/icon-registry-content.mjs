export function normalizeLineEndings(value) {
  return value.replace(/\r\n?/g, "\n");
}

export function hasSameGeneratedContent(existing, expected) {
  return normalizeLineEndings(existing) === normalizeLineEndings(expected);
}
