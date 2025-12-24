import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Beer, MapPin, Phone, Mail, Clock, Award, Users, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from '../components/Navigation';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [aboutRef, aboutInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [shopRef, shopInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [contactRef, contactInView] = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    // Hero parallax effect
    if (heroRef.current) {
      gsap.to(heroRef.current.querySelector('.hero-bg'), {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Floating beer animation
    gsap.to('.floating-beer', {
      y: -20,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
      <Navigation />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="hero-bg absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-amber-700 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <Beer className="w-24 h-24 text-amber-200 mx-auto mb-6 floating-beer" />
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight font-heading">
                Brouwerij<br />
                <span className="text-amber-200">Zoeplap</span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                Opgericht door 4 boys met een passie voor bier. Ontdek meer dan 300 unieke craft bieren 
                in een authentieke sfeer waar vriendschap en brouwkunst samenkomen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link
                to="/beers"
                className="group relative px-10 py-5 bg-white text-amber-900 rounded-full font-bold text-lg shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Ontdek Ons Bier
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
              
              <a
                href="#contact"
                className="px-10 py-5 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-amber-900 transition-all duration-300 hover:scale-105"
              >
                Bezoek Ons
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-200 mb-2">300+</div>
                <div className="text-amber-100 text-sm">Unieke Bieren</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-200 mb-2">15+</div>
                <div className="text-amber-100 text-sm">Jaar Ervaring</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-200 mb-2">4.8★</div>
                <div className="text-amber-100 text-sm">Gemiddelde Rating</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-heading">
              Over <span className="text-amber-600">Brouwerij Zoeplap</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-8" />
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Opgericht door 4 vrienden met een gedeelde droom: de beste craft bieren naar Nederland brengen. 
              Wat begon als een hobby is uitgegroeid tot een passie voor het cureren van unieke bieren uit de hele wereld.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Award,
                title: 'Kwaliteit Voorop',
                description: 'Alleen de beste bieren van gerenommeerde brouwerijen maken het naar onze kaart.',
              },
              {
                icon: Users,
                title: 'Expert Advies',
                description: 'Ons team helpt je graag bij het vinden van jouw perfecte bier.',
              },
              {
                icon: Heart,
                title: 'Passie voor Bier',
                description: 'Elke dag werken we met liefde aan het perfecte biermoment voor onze gasten.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={aboutInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <item.icon className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Preview Section */}
      <section id="shop" ref={shopRef} className="py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={shopInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <ShoppingBag className="w-16 h-16 text-amber-600 mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-heading">
              Onze <span className="text-amber-600">Collectie</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mb-8" />
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Van Belgische klassiekers tot moderne craft creaties - ontdek ons uitgebreide assortiment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'Wisseltap Bieren', count: '12+', color: 'from-amber-400 to-orange-400' },
              { name: 'Bierbijbel', count: '200+', color: 'from-orange-400 to-red-400' },
              { name: 'Vaste Tap', count: '8+', color: 'from-amber-500 to-orange-500' },
              { name: 'Op=Op Kaart', count: '25+', color: 'from-orange-500 to-amber-600' },
            ].map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={shopInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group cursor-pointer"
              >
                <Link to={`/beers?category=${encodeURIComponent(category.name)}`}>
                  <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-8 text-white shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                    <div className="text-4xl font-bold mb-2">{category.count}</div>
                    <div className="text-lg font-semibold">{category.name}</div>
                    <ArrowRight className="w-6 h-6 mt-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={shopInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center"
          >
            <Link
              to="/beers"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 hover:scale-105"
            >
              Bekijk Volledige Collectie
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" ref={contactRef} className="py-24 bg-gradient-to-br from-amber-900 via-orange-800 to-amber-700 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={contactInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-heading">
              Bezoek <span className="text-amber-200">Ons</span>
            </h2>
            <div className="w-24 h-1 bg-amber-200 mx-auto mb-8" />
            <p className="text-xl text-amber-100 max-w-3xl mx-auto">
              Kom langs en ervaar de unieke sfeer van Brouwerij Zoeplap
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={contactInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 font-heading">Adres</h3>
                  <p className="text-amber-100">
                    Voorstraat 123<br />
                    1234 AB Bierdorp<br />
                    Nederland
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 font-heading">Telefoon</h3>
                  <p className="text-amber-100">+31 (0)12 345 6789</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 font-heading">Email</h3>
                  <p className="text-amber-100">info@brouwerijzoeplap.nl</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 font-heading">Openingstijden</h3>
                  <div className="text-amber-100 space-y-1">
                    <p>Ma - Do: 16:00 - 00:00</p>
                    <p>Vr - Za: 14:00 - 02:00</p>
                    <p>Zondag: 14:00 - 23:00</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={contactInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold mb-6 font-heading">Stuur ons een bericht</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Naam"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <textarea
                  rows={4}
                  placeholder="Bericht"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                />
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-amber-200 text-amber-900 rounded-lg font-bold hover:bg-white transition-colors duration-300"
                >
                  Verstuur Bericht
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-950 text-amber-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <Beer className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            2024 Brouwerij Zoeplap. Alle rechten voorbehouden.
          </p>
          <p className="text-xs mt-2 opacity-75">
            Data van Untappd • Automatisch bijgewerkt elke dag om 06:00
          </p>
        </div>
      </footer>
    </div>
  );
}