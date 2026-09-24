export default function FamilyLoading() {
  return <div aria-label="Ładowanie osób" className="space-y-6" role="status">
    <div className="h-20 animate-pulse rounded-control bg-surface-muted" />
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="h-20 animate-pulse rounded-control bg-surface-muted" />
      <div className="h-20 animate-pulse rounded-control bg-surface-muted" />
    </div>
  </div>;
}
