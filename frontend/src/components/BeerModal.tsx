import { useState } from 'react';
import { Share2, Star, ExternalLink, Scale, Check, Beer } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import type { BeerData } from '../types/beer';
import { useComparison } from '../contexts/ComparisonContext';
import { useTheme } from '../contexts/ThemeContext';
import { haptics } from '../utils/haptic';
import Sheet from './Sheet';

interface BeerModalProps {
  beer: BeerData | null;
  onClose: () => void;
}

// Menu averages used as the dashed baseline in the taste profile
const AVG = { abv: 6.5, ibu: 35, rating: 3.6 };

// SVG attributes can't read CSS variables, so mirror the tokens from index.css
const CHART_COLORS = {
  dark: { gold: '#F2B33D', muted: '#B0A391', grid: 'rgba(246,238,223,0.15)' },
  light: { gold: '#8A5204', muted: '#66584A', grid: 'rgba(27,18,12,0.15)' },
};

export default function BeerModal({ beer, onClose }: BeerModalProps) {
  const { addToComparison, removeFromComparison, isInComparison, comparisonBeers } = useComparison();
  const [broken, setBroken] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  if (!beer) return null;

  const inCompare = isInComparison(beer.beer_url);
  const compareFull = !inCompare && comparisonBeers.length >= 4;

  const handleShare = async () => {
    const shareData = {
      title: `${beer.name} – BeerMenu`,
      text: `${beer.name} van ${beer.brewery || 'onbekend'} – ${beer.style || ''} (${beer.abv}% ABV)`,
      url: beer.beer_url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareNote('Link gekopieerd');
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      // share cancelled
    }
  };

  const toggleCompare = () => {
    haptics.select();
    if (inCompare) removeFromComparison(beer.beer_url);
    else addToComparison(beer);
  };

  const chartData = [
    { subject: 'Sterkte', A: Math.min(((beer.abv || 0) / 12) * 100, 100), B: (AVG.abv / 12) * 100 },
    { subject: 'Bitterheid', A: Math.min(((beer.ibu || 0) / 70) * 100, 100), B: (AVG.ibu / 70) * 100 },
    { subject: 'Waardering', A: ((beer.rating || 0) / 5) * 100, B: (AVG.rating / 5) * 100 },
  ];

  const stats = [
    { label: 'ABV', value: beer.abv != null ? `${beer.abv}%` : '–', tone: 'text-ember' },
    { label: 'IBU', value: beer.ibu ?? '–', tone: 'text-hop' },
    { label: 'Rating', value: beer.rating != null ? beer.rating.toFixed(2) : '–', tone: 'text-gold' },
  ];

  return (
    <Sheet
      open
      onClose={onClose}
      title={beer.name}
      footer={
        <div className="flex gap-2">
          <a href={beer.beer_url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
            Check-in op Untappd
            <ExternalLink className="w-4 h-4" aria-hidden />
          </a>
          <button
            type="button"
            onClick={toggleCompare}
            disabled={compareFull}
            className={`icon-btn w-12 h-12 border ${inCompare ? 'bg-fg text-bg border-fg hover:bg-fg' : 'border-line/15'}`}
            aria-pressed={inCompare}
            aria-label={inCompare ? 'Uit vergelijking halen' : compareFull ? 'Vergelijking zit vol (max 4)' : 'Toevoegen aan vergelijking'}
            title={compareFull ? 'Maximaal 4 bieren' : 'Vergelijk'}
          >
            {inCompare ? <Check className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
          </button>
          <button type="button" onClick={handleShare} className="icon-btn w-12 h-12 border border-line/15" aria-label="Delen">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      }
    >
      <div className="relative -mx-5 -mt-1 mb-5 h-52 grid place-items-center bg-[radial-gradient(circle_at_50%_60%,rgb(var(--gold)/0.18),transparent_60%)]">
        {beer.image_url && !broken ? (
          <img
            src={beer.image_url}
            alt={beer.name}
            onError={() => setBroken(true)}
            className="h-44 w-44 object-contain drop-shadow-2xl"
          />
        ) : (
          <Beer className="w-16 h-16 text-muted/60" aria-hidden />
        )}
      </div>

      <p className="eyebrow mb-1">{beer.style || beer.category}</p>
      <p className="text-muted mb-5">{beer.brewery}</p>

      <dl className="grid grid-cols-3 rounded-2xl border border-line/10 divide-x divide-line/10 mb-5 text-center">
        {stats.map((s) => (
          <div key={s.label} className="py-3">
            <dt className="stat-label">{s.label}</dt>
            <dd className={`mt-1 text-xl font-medium tabular ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-2xl border border-line/10 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="stat-label flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-gold" aria-hidden />
            Smaakprofiel
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold" />Dit bier</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-muted" />Gemiddeld</span>
          </div>
        </div>
        <div className="h-[200px] w-full" role="img" aria-label={`Sterkte ${beer.abv ?? '?'}%, bitterheid ${beer.ibu ?? '?'} IBU, waardering ${beer.rating?.toFixed(2) ?? '?'} vergeleken met het gemiddelde van de kaart`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="52%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke={c.grid} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: c.muted, fontSize: 11 }} />
              <Radar dataKey="B" stroke={c.muted} strokeWidth={1} strokeDasharray="3 3" fill="transparent" isAnimationActive={false} />
              <Radar dataKey="A" stroke={c.gold} strokeWidth={2} fill={c.gold} fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {shareNote && (
        <p role="status" className="mt-4 text-center text-sm text-hop">{shareNote}</p>
      )}
    </Sheet>
  );
}
