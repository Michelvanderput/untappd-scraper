import { useState, useEffect } from 'react';
import { Bell, BellOff, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { requestNotificationPermission, subscribeToNotifications, unsubscribeFromNotifications } from '../utils/notifications';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check current notification status
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleToggleNotifications = async () => {
    setLoading(true);

    try {
      if (notificationsEnabled) {
        // Unsubscribe
        await unsubscribeFromNotifications();
        setNotificationsEnabled(false);
      } else {
        // Request permission and subscribe
        const granted = await requestNotificationPermission();
        
        if (granted) {
          await subscribeToNotifications();
          setNotificationsEnabled(true);
          setNotificationPermission('granted');
        } else {
          alert('Notifications zijn geblokkeerd. Wijzig dit in je browser instellingen.');
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

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
            <SettingsIcon className="w-12 h-12 text-amber-600 dark:text-amber-500" />
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white font-heading">
              Instellingen
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Beheer je voorkeuren en notificaties
          </p>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-amber-100 dark:border-amber-900/30"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Push Notificaties
          </h2>

          <div className="space-y-6">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-amber-100 mb-1">
                  Notificaties inschakelen
                </h3>
                <p className="text-sm text-gray-600 dark:text-amber-200/70">
                  Ontvang meldingen over nieuwe bieren en Beerdle updates
                </p>
              </div>
              
              <button
                onClick={handleToggleNotifications}
                disabled={loading}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  notificationsEnabled
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
                    notificationsEnabled ? 'translate-x-12' : 'translate-x-1'
                  }`}
                >
                  {notificationsEnabled ? (
                    <Bell className="w-6 h-6 text-amber-600 m-2" />
                  ) : (
                    <BellOff className="w-6 h-6 text-gray-400 m-2" />
                  )}
                </span>
              </button>
            </div>

            {/* Status Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Status: {notificationPermission === 'granted' ? '✅ Actief' : notificationPermission === 'denied' ? '❌ Geblokkeerd' : '⏸️ Niet ingesteld'}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {notificationPermission === 'granted' && 'Je ontvangt notificaties over nieuwe bieren en Beerdle updates.'}
                {notificationPermission === 'denied' && 'Notificaties zijn geblokkeerd. Wijzig dit in je browser instellingen.'}
                {notificationPermission === 'default' && 'Klik op de schakelaar om notificaties in te schakelen.'}
              </p>
            </div>

            {/* Notification Types */}
            {notificationsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <h3 className="font-semibold text-gray-800 dark:text-amber-100 mb-3">
                  Notificatie types:
                </h3>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🍺</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-green-300">Nieuwe Bieren</p>
                    <p className="text-sm text-gray-600 dark:text-green-400/70">Wanneer er nieuwe bieren worden toegevoegd</p>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🎮</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-purple-300">Beerdle Update</p>
                    <p className="text-sm text-gray-600 dark:text-purple-400/70">Wanneer er een nieuwe Beerdle beschikbaar is</p>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">✓</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">⏰</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-orange-300">Beerdle Reminder</p>
                    <p className="text-sm text-gray-600 dark:text-orange-400/70">Herinnering als je nog niet hebt gespeeld</p>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">✓</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-orange-950/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-100 dark:border-amber-900/30"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-amber-100 mb-4">
            ℹ️ Over Notificaties
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-amber-200/70">
            <p>
              • Notificaties worden verstuurd wanneer er nieuwe bieren worden toegevoegd aan het menu
            </p>
            <p>
              • Je ontvangt een melding wanneer er een nieuwe Beerdle beschikbaar is
            </p>
            <p>
              • De app controleert 3x per dag op updates (06:00, 12:00 en 18:00 UTC)
            </p>
            <p>
              • Je kunt notificaties op elk moment uit- en weer inschakelen
            </p>
            <p className="text-sm italic">
              💡 Tip: Notificaties werken alleen als de browser toestemming heeft gekregen
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
