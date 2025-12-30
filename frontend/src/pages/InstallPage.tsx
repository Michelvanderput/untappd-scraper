import { Smartphone, Share, Home, MoreVertical, Download, Wifi, Zap, Bell, CheckCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';

export default function InstallPage() {
  return (
    <PageLayout title="Installeer de App" subtitle="Gebruik BeerMenu als een echte app op je telefoon!">
        <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-6 font-heading flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500" />
                    Waarom installeren?
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Sneller</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Direct openen vanaf je home screen zonder browser balken.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">App Ervaring</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Volledig scherm en native feel op je toestel.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <Wifi className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Offline Modus</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Bekijk bieren zelfs zonder internetverbinding.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Updates</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Automatisch altijd de nieuwste versie.</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Android Instructions */}
                <Card className="p-8 h-full" hoverable={false}>
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
                            <Smartphone className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Android</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Chrome Browser</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative">
                        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700 -z-10" />
                        
                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/30 z-10">1</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Open het menu</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tik op de drie puntjes rechtsboven.</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                    <MoreVertical className="w-3 h-3" /> Menu
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/30 z-10">2</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Installeer</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Kies "App installeren" of "Toevoegen aan startscherm".</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                    <Download className="w-3 h-3" /> App installeren
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/30 z-10">3</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Klaar!</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">De app staat nu op je startscherm.</p>
                                <div className="mt-2 text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* iOS Instructions */}
                <Card className="p-8 h-full" hoverable={false}>
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Smartphone className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">iPhone</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Safari Browser</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative">
                        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700 -z-10" />
                        
                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 z-10">1</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delen</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tik op de deel-knop onderin de balk.</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                    <Share className="w-3 h-3" /> Deel
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 z-10">2</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Zet op beginscherm</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Scroll naar beneden en kies deze optie.</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                    <Home className="w-3 h-3" /> Zet op beginscherm
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 relative">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 z-10">3</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Klaar!</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Bevestig met "Voeg toe".</p>
                                <div className="mt-2 text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </PageLayout>
  );
}
