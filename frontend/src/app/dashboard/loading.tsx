export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded" />
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
