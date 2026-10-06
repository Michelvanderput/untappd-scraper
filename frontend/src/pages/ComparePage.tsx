import { Link } from 'react-router-dom';
import { ArrowLeft, Beer, Plus, Trash2, X, ExternalLink, Scale } from 'lucide-react';
import { useComparison } from '../contexts/ComparisonContext';
import type { BeerData } from '../types/beer';
import PageLayout from '../components/PageLayout';
import { stagger } from '../lib/stagger';
import EmptyState from '../components/EmptyState';

type Attr = {
  key: keyof BeerData;
  label: string;
  suffix?: string;
  /** numeric attributes get a bar; `max` is the bar's full scale */
  max?: number;
  decimals?: number;
};

const NUMERIC: Attr[] = [
  { key: 'abv', label: 'Alcohol', suffix: '%', max: 14 },
  { key: 'ibu', label: 'Bitterheid (IBU)', max: 100 },
  { key: 'rating', label: 'Rating', max: 5, decimals: 2 },
];

const TEXT: Attr[] = [
  { key: 'style', label: 'Stijl' },
  { key: 'brewery', label: 'Brouwerij' },
  { key: 'category', label: 'Categorie' },
  { key: 'container', label: 'Verpakking' },
];

export default function ComparePage() {
  const { comparisonBeers, clearComparison, removeFromComparison } = useComparison();
  const n = comparisonBeers.length;

  if (n === 0) {
    return (
      <PageLayout eyebrow="Vergelijken" title="Naast elkaar" contentWidth="narrow">
        <EmptyState
          icon={Scale}
          title="Nog niks gekozen"
          description="Open een bier en tik op het weegschaal-icoon om het toe te voegen. Je kunt tot 4 bieren vergelijken."
          action={
            <Link to="/" className="btn-primary">
              <ArrowLeft className="w-4 h-4" />
              Naar de kaart
            </Link>
          }
        />
      </PageLayout>
    );
  }

  const cols = { gridTemplateColumns: `repeat(${n + (n < 4 ? 1 : 0)}, minmax(140px, 1fr))` };

  return (
    <PageLayout
      eyebrow="Vergelijken"
      title="Naast elkaar"
      subtitle={`${n} ${n === 1 ? 'bier' : 'bieren'} op een rij. De beste waarde licht op.`}
      aside={
        <button type="button" onClick={clearComparison} className="btn-ghost text-ember">
          <Trash2 className="w-4 h-4" />
          Alles wissen
        </button>
      }
    >
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
        <div className="min-w-max sm:min-w-0 space-y-6">
          {/* Beer headers */}
          <div className="grid gap-3" style={cols}>
            {comparisonBeers.map((beer, i) => (
              <div key={beer.beer_url} style={stagger(i * 1.3)} className="enter-up relative surface p-4 flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => removeFromComparison(beer.beer_url)}
                  className="absolute top-1 right-1 icon-btn w-10 h-10 text-muted"
                  aria-label={`${beer.name} verwijderen`}
                >
                  <X className="w-4 h-4" />
                </button>
                {beer.image_url ? (
                  <img src={beer.image_url} alt="" className="w-20 h-20 object-contain mb-3 drop-shadow-lg" />
                ) : (
                  <Beer className="w-12 h-12 text-muted/60 my-4" aria-hidden />
                )}
                <a
                  href={beer.beer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium leading-tight line-clamp-2 hover:text-gold transition-colors"
                >
                  {beer.name}
                  <ExternalLink className="inline w-3 h-3 ml-1 opacity-60" aria-hidden />
                </a>
              </div>
            ))}
            {n < 4 && (
              <Link
                to="/"
                className="rounded-3xl border border-dashed border-line/20 grid place-items-center text-muted hover:text-gold hover:border-gold/40 transition-colors min-h-[160px]"
              >
                <span className="flex flex-col items-center gap-2 text-sm">
                  <Plus className="w-6 h-6" />
                  Voeg toe
                </span>
              </Link>
            )}
          </div>

          {/* Numeric attributes */}
          {NUMERIC.map((attr) => {
            const values = comparisonBeers.map((b) => b[attr.key] as number | null);
            const present = values.filter((v): v is number => v != null);
            const best = present.length > 1 ? Math.max(...present) : null;
            return (
              <section key={attr.key}>
                <h3 className="stat-label mb-2">{attr.label}</h3>
                <div className="grid gap-3" style={cols}>
                  {values.map((v, i) => {
                    const isBest = v != null && v === best && present.some((p) => p !== best);
                    return (
                      <div key={i} className={`rounded-2xl p-3 border ${isBest ? 'border-gold/60 bg-gold/10' : 'border-line/10'}`}>
                        <p className={`text-2xl font-medium tabular ${isBest ? 'text-gold' : ''}`}>
                          {v != null ? `${attr.decimals ? v.toFixed(attr.decimals) : v}${attr.suffix ?? ''}` : '–'}
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-line/10 overflow-hidden">
                          <div
                            className={`grow-x h-full rounded-full ${isBest ? 'bg-gold' : 'bg-fg/40'}`}
                            style={{ width: `${Math.min(100, ((v ?? 0) / (attr.max ?? 1)) * 100)}%`, ...stagger(i) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {n < 4 && <div />}
                </div>
              </section>
            );
          })}

          {/* Text attributes */}
          {TEXT.map((attr) => (
            <section key={attr.key}>
              <h3 className="stat-label mb-2">{attr.label}</h3>
              <div className="grid gap-3" style={cols}>
                {comparisonBeers.map((beer) => (
                  <p key={beer.beer_url} className="text-sm px-1">
                    {(beer[attr.key] as string | null) || <span className="text-muted">–</span>}
                  </p>
                ))}
                {n < 4 && <div />}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
