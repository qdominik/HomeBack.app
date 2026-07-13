type StatCardProps = {
  label: string;
  value: number;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-control border border-line bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}