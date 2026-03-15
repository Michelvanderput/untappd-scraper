import { Link } from 'react-router-dom';
import { Beer, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-6">
          <Beer className="w-12 h-12" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          404
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Deze pagina bestaat niet. Ga terug naar het menu.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Naar bieren
        </Link>
      </div>
    </div>
  );
}
