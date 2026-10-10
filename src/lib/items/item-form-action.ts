/** Transport exceptions must not reach React's error boundary or expose payloads. */
export async function settleItemFormAction<T>(
  action: () => Promise<T>,
  failure: T,
): Promise<T> {
  try {
    return await action();
  } catch {
    return failure;
  }
}
