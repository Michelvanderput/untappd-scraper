import { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Beer, TrendingUp, Sparkles, Spade, Dices, Download, Search, CornerDownLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBeers } from '../hooks/useBeers';
import { haptics } from '../utils/haptic';
import { OPEN_COMMAND_EVENT } from '../lib/command';

const PAGES: { path: string; label: string; hint: string; icon: LucideIcon }[] = [
  { path: '/', label: 'Bieren', hint: 'De hele kaart', icon: Beer },
  { path: '/trends', label: 'Trends', hint: 'Nieuw en best beoordeeld', icon: TrendingUp },
  { path: '/surprise', label: 'Verras me', hint: 'Het lot kiest een bier', icon: Dices },
  { path: '/menu-builder', label: 'Menu', hint: 'Laat een menu samenstellen', icon: Sparkles },
  { path: '/toepen', label: 'Toepen', hint: 'Punten bijhouden', icon: Spade },
  { path: '/install', label: 'Installeer de app', hint: 'Op je beginscherm', icon: Download },
];

const MAX_BEERS = 8;

function Results({ query, onPick }: { query: string; onPick: (path: string) => void }) {
  const { beers } = useBeers();
  const q = query.toLowerCase().trim();

  const pages = useMemo(
    () => PAGES.filter((p) => !q || `${p.label} ${p.hint}`.toLowerCase().includes(q)),
    [q]
  );

  const matches = useMemo(() => {
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    const seen = new Set<string>();
    const out = [];
    for (const b of beers) {
      const text = [b.name, b.brewery, b.style].filter(Boolean).join(' ').toLowerCase();
      if (!terms.every((t) => text.includes(t))) continue;
      const key = `${b.name}|${b.brewery}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(b);
      if (out.length >= MAX_BEERS) break;
    }
    return out;
  }, [beers, q]);

  return (
    <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2" data-lenis-prevent>
      <Command.Empty className="px-4 py-10 text-center text-sm text-muted">
        Niks gevonden voor “{query}”.
      </Command.Empty>

      {matches.length > 0 && (
        <Command.Group heading="Bieren" className="palette-group">
          {matches.map((b) => (
            <Command.Item
              key={b.beer_url}
              value={b.beer_url}
              onSelect={() => onPick(`/?beer=${encodeURIComponent(b.beer_url)}`)}
              className="palette-item"
            >
              <Beer className="w-4 h-4 text-gold shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{b.name}</span>
                <span className="block truncate text-xs text-muted">{[b.brewery, b.style].filter(Boolean).join(' · ')}</span>
              </span>
              {b.abv != null && <span className="text-xs text-ember tabular">{b.abv}%</span>}
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {pages.length > 0 && (
        <Command.Group heading="Ga naar" className="palette-group">
          {pages.map(({ path, label, hint, icon: Icon }) => (
            <Command.Item key={path} value={path} onSelect={() => onPick(path)} className="palette-item">
              <Icon className="w-4 h-4 text-muted shrink-0" aria-hidden />
              <span className="flex-1 text-[15px]">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </Command.List>
  );
}

/**
 * ⌘K / Ctrl+K command menu: jump to a page or straight to a beer.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  const pick = (path: string) => {
    haptics.tap();
    setOpen(false);
    navigate(path, { viewTransition: true });
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
      label="Zoeken en navigeren"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-[palette-fade_0.2s_ease-out]"
      contentClassName="fixed left-1/2 top-[12vh] z-[91] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-line/10 bg-surface shadow-2xl data-[state=open]:animate-[palette-pop_0.3s_cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="flex items-center gap-3 border-b border-line/10 px-5">
        <Search className="w-5 h-5 text-muted shrink-0" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Zoek een bier, brouwerij of pagina…"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
        <kbd className="hidden sm:block rounded-md border border-line/15 px-1.5 py-0.5 text-[11px] text-muted">esc</kbd>
      </div>
      {open && <Results query={query} onPick={pick} />}
      <div className="hidden sm:flex items-center justify-end gap-2 border-t border-line/10 px-4 py-2 text-xs text-muted">
        <CornerDownLeft className="w-3.5 h-3.5" aria-hidden /> openen
      </div>
    </Command.Dialog>
  );
}
