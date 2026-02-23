export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}
