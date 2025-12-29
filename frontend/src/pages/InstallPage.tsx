import { motion } from 'framer-motion';
import { Smartphone, Share, Home, MoreVertical, Download } from 'lucide-react';

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="w-12 h-12 text-amber-600 dark:text-amber-500" />
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white font-heading">
              Installeer de App
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Gebruik BeerMenu als een echte app op je telefoon!
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-amber-100 dark:border-amber-900/30"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-6">
            ✨ Voordelen van de App
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-2xl">🚀</span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-amber-100">Sneller</h3>
                <p className="text-sm text-gray-600 dark:text-amber-200/70">Direct openen vanaf je home screen</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-amber-100">App-gevoel</h3>
                <p className="text-sm text-gray-600 dark:text-amber-200/70">Volledig scherm zonder browser UI</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-2xl">📴</span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-amber-100">Offline</h3>
                <p className="text-sm text-gray-600 dark:text-amber-200/70">Werkt ook zonder internet</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-2xl">🔔</span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-amber-100">Updates</h3>
                <p className="text-sm text-gray-600 dark:text-amber-200/70">Automatisch de nieuwste versie</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Android Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-green-950/40 dark:to-emerald-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-green-100 dark:border-green-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-green-100">
              Android (Chrome)
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-green-100 mb-2">
                  Open het menu
                </h3>
                <p className="text-gray-600 dark:text-green-200/70 mb-3">
                  Tik op de drie puntjes <MoreVertical className="inline w-4 h-4" /> rechtsboven in Chrome
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <MoreVertical className="w-5 h-5" />
                    <span className="font-medium">Menu openen</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-green-100 mb-2">
                  Kies "App installeren" of "Toevoegen aan startscherm"
                </h3>
                <p className="text-gray-600 dark:text-green-200/70 mb-3">
                  Scroll in het menu en zoek naar deze optie
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                    <Download className="w-5 h-5" />
                    <span className="font-medium">App installeren</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-green-100 mb-2">
                  Bevestig installatie
                </h3>
                <p className="text-gray-600 dark:text-green-200/70 mb-3">
                  Tik op "Installeren" in de popup
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="text-green-800 dark:text-green-300 font-medium mb-2">✅ Klaar!</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      De app verschijnt nu op je home screen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* iPhone Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-blue-950/40 dark:to-indigo-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 dark:border-blue-900/30"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🍎</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-blue-100">
              iPhone (Safari)
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-blue-100 mb-2">
                  Open de website in Safari
                </h3>
                <p className="text-gray-600 dark:text-blue-200/70 mb-3">
                  ⚠️ Belangrijk: Dit werkt alleen in Safari, niet in Chrome!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Smartphone className="w-5 h-5" />
                    <span className="font-medium">Open in Safari</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-blue-100 mb-2">
                  Tik op de "Deel" knop
                </h3>
                <p className="text-gray-600 dark:text-blue-200/70 mb-3">
                  Dit is het vierkantje met een pijl naar boven, onderaan het scherm
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Share className="w-5 h-5" />
                    <span className="font-medium">Deel knop</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-blue-100 mb-2">
                  Scroll en kies "Zet op beginscherm"
                </h3>
                <p className="text-gray-600 dark:text-blue-200/70 mb-3">
                  Scroll in het menu naar beneden tot je deze optie ziet
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Zet op beginscherm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-blue-100 mb-2">
                  Bevestig met "Voeg toe"
                </h3>
                <p className="text-gray-600 dark:text-blue-200/70 mb-3">
                  Je kunt eventueel de naam aanpassen
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">✅ Klaar!</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      De app verschijnt nu op je home screen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-100 dark:border-amber-900/30"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-4">
            💡 Tips
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-amber-200/70">
            <p>
              • De app werkt ook <strong>offline</strong> - ideaal voor in de kroeg zonder wifi!
            </p>
            <p>
              • Updates worden <strong>automatisch</strong> geïnstalleerd wanneer je de app opent
            </p>
            <p>
              • Je kunt de app altijd verwijderen zoals elke andere app
            </p>
            <p>
              • De app gebruikt <strong>geen extra opslagruimte</strong> - het is gewoon een snelkoppeling!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
