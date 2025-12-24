import { Link } from 'react-router-dom';
import { Beer, Search, Shuffle, TrendingUp, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Beer className="w-20 h-20 text-amber-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
            Biertaverne De Gouverneur
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ontdek ons uitgebreide biermenu met honderden unieke bieren. 
            Van klassieke Belgische tripels tot moderne craft IPA's.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/beers"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              <Search className="w-6 h-6" />
              Bekijk Alle Bieren
            </Link>
            
            <Link
              to="/beers?random=true"
              className="flex items-center gap-2 px-8 py-4 bg-white text-amber-600 border-2 border-amber-600 rounded-xl hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              <Shuffle className="w-6 h-6" />
              Random Bier
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beer className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Uitgebreid Assortiment
            </h3>
            <p className="text-gray-600">
              Meer dan 300 unieke bieren van lokale en internationale brouwerijen
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Dagelijks Bijgewerkt
            </h3>
            <p className="text-gray-600">
              Ons menu wordt automatisch dagelijks geüpdatet met de nieuwste bieren
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Top Ratings
            </h3>
            <p className="text-gray-600">
              Bekijk ratings en reviews van de Untappd community
            </p>
          </div>
        </div>

        {/* Categories Preview */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Onze Categorieën
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/beers?category=Wisseltap bieren"
              className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-amber-200 hover:border-amber-400"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Wisseltap Bieren
              </h3>
              <p className="text-sm text-gray-600">
                Roterende selectie van speciale bieren
              </p>
            </Link>

            <Link
              to="/beers?category=Op=Op kaart"
              className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-amber-200 hover:border-amber-400"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Op=Op Kaart
              </h3>
              <p className="text-sm text-gray-600">
                Beperkte voorraad, wees er snel bij!
              </p>
            </Link>

            <Link
              to="/beers?category=Vaste bieren van de tap"
              className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-amber-200 hover:border-amber-400"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Vaste Tap Bieren
              </h3>
              <p className="text-sm text-gray-600">
                Onze klassieke vaste selectie
              </p>
            </Link>

            <Link
              to="/beers?category=Bierbijbel"
              className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all border-2 border-amber-200 hover:border-amber-400"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Bierbijbel
              </h3>
              <p className="text-sm text-gray-600">
                Onze volledige flessencollectie
              </p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Data van Untappd • Automatisch bijgewerkt elke dag om 06:00
          </p>
        </div>
      </div>
    </div>
  );
}