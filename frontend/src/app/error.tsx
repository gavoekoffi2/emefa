"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3">Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
