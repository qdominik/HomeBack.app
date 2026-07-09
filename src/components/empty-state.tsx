export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
      {text}
    </div>
  );
}
