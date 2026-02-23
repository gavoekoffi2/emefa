import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">Page introuvable</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
