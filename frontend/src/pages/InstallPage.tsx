import { useEffect, useRef, useState } from 'react';
import { Share, SquarePlus, MoreVertical, Download, Wifi, Zap, Maximize, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { canPromptInstall, isInstalled, promptInstall } from '../utils/pwa';
import { stagger } from '../lib/stagger';
import { useSlidingPill } from '../lib/useSlidingPill';

type Platform = 'ios' | 'android';

const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Zap, title: 'Sneller', text: 'Direct open vanaf je beginscherm.' },
  { icon: Maximize, title: 'Volledig scherm', text: 'Geen browserbalken, voelt als een app.' },
  { icon: Wifi, title: 'Offline', text: 'De kaart werkt ook zonder bereik.' },
  { icon: RefreshCw, title: 'Altijd actueel', text: 'Updates komen vanzelf binnen.' },
];

const STEPS: Record<Platform, { icon: LucideIcon; title: string; text: string }[]> = {
  ios: [
    { icon: Share, title: 'Tik op Deel', text: 'De deel-knop onderin Safari.' },
    { icon: SquarePlus, title: 'Zet op beginscherm', text: 'Scroll omlaag in het menu en kies deze optie.' },
    { icon: CheckCircle2, title: 'Voeg toe', text: 'Bevestig rechtsboven. Klaar.' },
  ],
  android: [
    { icon: MoreVertical, title: 'Open het menu', text: 'De drie puntjes rechtsboven in Chrome.' },
    { icon: Download, title: 'App installeren', text: 'Of "Toevoegen aan startscherm".' },
    { icon: CheckCircle2, title: 'Klaar', text: 'BeerMenu staat nu tussen je apps.' },
  ],
};

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>(() => (/android/i.test(navigator.userAgent) ? 'android' : 'ios'));
  const tabs = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useSlidingPill(tabs, pill, '[aria-selected="true"]', platform);
  const [installable, setInstallable] = useState(canPromptInstall);
  const [installed, setInstalled] = useState(isInstalled);

  useEffect(() => {
    const onInstallable = () => setInstallable(true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    const accepted = await promptInstall();
    setInstallable(canPromptInstall());
    if (accepted) setInstalled(true);
  };

  return (
    <PageLayout eyebrow="App" title="Op je beginscherm" subtitle="Installeer BeerMenu en open de kaart met één tik." contentWidth="narrow">
      <div className="space-y-10">
        {installed ? (
          <div className="surface p-5 flex items-center gap-3 border-hop/40">
            <CheckCircle2 className="w-6 h-6 text-hop shrink-0" aria-hidden />
            <p>BeerMenu is al geïnstalleerd op dit apparaat.</p>
          </div>
        ) : (
          installable && (
            <button type="button" onClick={install} className="btn-primary w-full h-14 text-lg">
              <Download className="w-5 h-5" />
              Installeer nu
            </button>
          )
        )}

        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={stagger(4 + i)} className="enter-up surface p-4">
              <Icon className="w-5 h-5 text-gold mb-4" aria-hidden />
              <h2 className="font-medium mb-1">{title}</h2>
              <p className="text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>

        <section>
          <div ref={tabs} className="relative inline-flex p-1 mb-6 rounded-full bg-surface border border-line/10" role="tablist" aria-label="Toestel">
            <span ref={pill} className="absolute left-0 top-0 rounded-full bg-fg opacity-0 invisible pointer-events-none" aria-hidden />
            {(['ios', 'android'] as const).map((p) => {
              const active = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPlatform(p)}
                  className={`relative z-10 px-5 min-h-[40px] rounded-full text-sm font-medium transition-colors ${active ? 'text-bg' : 'text-muted hover:text-fg'}`}
                >
                  {p === 'ios' ? 'iPhone' : 'Android'}
                </button>
              );
            })}
          </div>

          <ol className="relative space-y-6" role="tabpanel">
            <span className="absolute left-5 top-5 bottom-5 w-px bg-line/15" aria-hidden />
            {STEPS[platform].map(({ icon: Icon, title, text }, i) => (
              <li key={`${platform}-${i}`} style={stagger(i * 2)} className="enter-left relative flex gap-4">
                <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full bg-gold text-on-gold font-display italic font-extrabold shrink-0">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-medium flex items-center gap-2">
                    {title}
                    <Icon className="w-4 h-4 text-muted" aria-hidden />
                  </h3>
                  <p className="text-sm text-muted mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageLayout>
  );
}
