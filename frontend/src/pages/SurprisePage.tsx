import BeerRandomizer from '../components/BeerRandomizer';
import BottleCap from '../components/BottleCap';
import PageLayout from '../components/PageLayout';
import SEO from '../components/SEO';
import { useBeers } from '../hooks/useBeers';

export default function SurprisePage() {
  const { beers, loading } = useBeers();

  return (
    <>
      <SEO title="Verras me – BeerMenu" description="Laat het lot een bier van de kaart kiezen." />
      <PageLayout eyebrow="Het lot beslist" title="Verras me" contentWidth="compact">
        {loading && beers.length === 0 ? (
          <div className="grid place-items-center py-24" role="status" aria-label="Bieren laden">
            <BottleCap className="w-14 h-14" spinning />
          </div>
        ) : (
          <BeerRandomizer beers={beers} />
        )}
      </PageLayout>
    </>
  );
}
