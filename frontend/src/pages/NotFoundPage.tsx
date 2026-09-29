import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BottleCap from '../components/BottleCap';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <BottleCap className="w-20 h-20 mb-8 -rotate-12">
        <span className="font-display italic font-extrabold text-xl">404</span>
      </BottleCap>
      <h1 className="font-display italic font-extrabold text-5xl mb-3">Glas leeg</h1>
      <p className="text-muted max-w-xs mb-8">Deze pagina staat niet op de kaart.</p>
      <Link to="/" className="btn-primary">
        <ArrowLeft className="w-4 h-4" />
        Terug naar de bieren
      </Link>
    </div>
  );
}
