import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function HomePage() {
  const [aboutRef, aboutInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [beerRef, beerInView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <div className="min-h-screen bg-[#EDE8E1]">
      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#EDE8E1]/95 backdrop-blur-sm border-b border-[#2C5F5D]/10">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <a href="#about" className="text-sm tracking-wider text-[#2C5F5D] hover:opacity-70 transition-opacity">
                Ons Verhaal
              </a>
              <Link to="/beers" className="text-sm tracking-wider text-[#2C5F5D] hover:opacity-70 transition-opacity">
                Onze Bieren
              </Link>
              <a href="#contact" className="text-sm tracking-wider text-[#2C5F5D] hover:opacity-70 transition-opacity">
                Contact
              </a>
            </div>
            
            <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
              <div className="text-center">
                <div className="text-2xl font-heading text-[#2C5F5D] tracking-tight">Brouwerij Zoeplap</div>
                <div className="text-xs tracking-widest text-[#2C5F5D]/60 uppercase">Craft Beer</div>
              </div>
            </Link>
            
            <Link
              to="/beers"
              className="px-8 py-3 bg-[#2C5F5D] text-[#EDE8E1] text-sm tracking-wider hover:bg-[#234948] transition-colors rounded-full"
            >
              Ontdek Menu
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Palm Leaves */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Decorative Palm Leaves - Left */}
        <div className="absolute left-0 top-1/4 w-64 h-96 opacity-10">
          <svg viewBox="0 0 200 400" className="w-full h-full text-[#2C5F5D]">
            <path
              d="M100,50 Q80,100 70,150 Q60,200 50,250 Q40,300 30,350"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path d="M70,150 Q50,140 30,130 Q10,120 0,110" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M60,200 Q40,195 20,190 Q5,185 0,180" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M50,250 Q35,248 20,245 Q10,243 0,240" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M70,150 Q85,145 100,140 Q115,135 130,130" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M60,200 Q75,198 90,195 Q105,192 120,190" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M50,250 Q65,250 80,248 Q95,246 110,245" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Decorative Palm Leaves - Right */}
        <div className="absolute right-0 top-1/4 w-64 h-96 opacity-10 transform scale-x-[-1]">
          <svg viewBox="0 0 200 400" className="w-full h-full text-[#2C5F5D]">
            <path
              d="M100,50 Q80,100 70,150 Q60,200 50,250 Q40,300 30,350"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path d="M70,150 Q50,140 30,130 Q10,120 0,110" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M60,200 Q40,195 20,190 Q5,185 0,180" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M50,250 Q35,248 20,245 Q10,243 0,240" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M70,150 Q85,145 100,140 Q115,135 130,130" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M60,200 Q75,198 90,195 Q105,192 120,190" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M50,250 Q65,250 80,248 Q95,246 110,245" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <div className="container mx-auto px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            <h1 className="text-7xl md:text-9xl font-heading text-[#2C5F5D] mb-8 leading-none">
              Onvergetelijke
              <br />
              <span className="italic font-light">momenten</span> beginnen
              <br />
              met het <span className="italic font-light">bier.</span>
            </h1>
          </motion.div>

          {/* Video/Image placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="aspect-video bg-[#2C5F5D]/10 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-[#2C5F5D]/30">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-32 bg-white">
        <div className="container mx-auto px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-6xl md:text-7xl font-heading text-[#2C5F5D] mb-12 leading-tight">
              Vier vrienden,
              <br />
              <span className="italic font-light">één passie</span>
            </h2>
            <p className="text-xl text-[#2C5F5D]/70 leading-relaxed max-w-2xl mx-auto mb-8">
              Wat begon als een gedeelde liefde voor bijzondere bieren, groeide uit tot Brouwerij Zoeplap. 
              Wij cureren de beste craft bieren uit Nederland en de rest van de wereld.
            </p>
            <p className="text-lg text-[#2C5F5D]/60 leading-relaxed max-w-2xl mx-auto">
              Elke fles vertelt een verhaal. Elk glas is een ontdekking. 
              Welkom in onze wereld van smaak en vakmanschap.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid md:grid-cols-3 gap-12 mt-24"
          >
            <div className="text-center">
              <div className="text-5xl font-heading text-[#2C5F5D] mb-3">300+</div>
              <div className="text-sm tracking-wider text-[#2C5F5D]/60 uppercase">Unieke Bieren</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-heading text-[#2C5F5D] mb-3">4</div>
              <div className="text-sm tracking-wider text-[#2C5F5D]/60 uppercase">Oprichters</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-heading text-[#2C5F5D] mb-3">∞</div>
              <div className="text-sm tracking-wider text-[#2C5F5D]/60 uppercase">Momenten</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beer Collection Section */}
      <section id="beers" ref={beerRef} className="py-32 bg-[#EDE8E1]">
        <div className="container mx-auto px-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={beerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-6xl md:text-7xl font-heading text-[#2C5F5D] mb-8 leading-tight">
              Onze <span className="italic font-light">collectie</span>
            </h2>
            <p className="text-lg text-[#2C5F5D]/70 max-w-2xl mx-auto">
              Van Belgische klassiekers tot experimentele brouwsels - ontdek ons zorgvuldig samengestelde assortiment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              { name: 'Wisseltap Bieren', count: '12+', desc: 'Steeds wisselende selectie' },
              { name: 'Bierbijbel', count: '200+', desc: 'Onze volledige collectie' },
              { name: 'Vaste Tap', count: '8+', desc: 'Onze klassiekers' },
              { name: 'Op=Op Kaart', count: '25+', desc: 'Exclusieve vondsten' },
            ].map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                animate={beerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link
                  to={`/beers?category=${encodeURIComponent(category.name)}`}
                  className="block group"
                >
                  <div className="bg-white p-10 hover:bg-[#2C5F5D] transition-all duration-500 border border-[#2C5F5D]/10">
                    <div className="flex items-baseline justify-between mb-4">
                      <h3 className="text-3xl font-heading text-[#2C5F5D] group-hover:text-[#EDE8E1] transition-colors">
                        {category.name}
                      </h3>
                      <span className="text-5xl font-heading text-[#2C5F5D]/30 group-hover:text-[#EDE8E1]/30 transition-colors">
                        {category.count}
                      </span>
                    </div>
                    <p className="text-sm text-[#2C5F5D]/60 group-hover:text-[#EDE8E1]/80 transition-colors tracking-wide">
                      {category.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={beerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center"
          >
            <Link
              to="/beers"
              className="inline-block px-12 py-4 bg-[#2C5F5D] text-[#EDE8E1] text-sm tracking-widest hover:bg-[#234948] transition-colors"
            >
              BEKIJK VOLLEDIGE COLLECTIE
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-white">
        <div className="container mx-auto px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-6xl md:text-7xl font-heading text-[#2C5F5D] mb-8">
              Kom <span className="italic font-light">langs</span>
            </h2>
            <p className="text-lg text-[#2C5F5D]/70">
              Ervaar de sfeer en proef het verschil
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm tracking-widest text-[#2C5F5D]/60 uppercase mb-3">Adres</h3>
                <p className="text-lg text-[#2C5F5D]">
                  Voorstraat 123<br />
                  1234 AB Bierdorp<br />
                  Nederland
                </p>
              </div>

              <div>
                <h3 className="text-sm tracking-widest text-[#2C5F5D]/60 uppercase mb-3">Contact</h3>
                <p className="text-lg text-[#2C5F5D]">
                  +31 (0)12 345 6789<br />
                  info@brouwerijzoeplap.nl
                </p>
              </div>

              <div>
                <h3 className="text-sm tracking-widest text-[#2C5F5D]/60 uppercase mb-3">Openingstijden</h3>
                <div className="text-lg text-[#2C5F5D] space-y-1">
                  <p>Ma - Do: 16:00 - 00:00</p>
                  <p>Vr - Za: 14:00 - 02:00</p>
                  <p>Zo: 14:00 - 23:00</p>
                </div>
              </div>
            </div>

            <div>
              <form className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Naam"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#2C5F5D]/20 text-[#2C5F5D] placeholder-[#2C5F5D]/40 focus:outline-none focus:border-[#2C5F5D] transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#2C5F5D]/20 text-[#2C5F5D] placeholder-[#2C5F5D]/40 focus:outline-none focus:border-[#2C5F5D] transition-colors"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Bericht"
                    className="w-full px-0 py-3 bg-transparent border-b border-[#2C5F5D]/20 text-[#2C5F5D] placeholder-[#2C5F5D]/40 focus:outline-none focus:border-[#2C5F5D] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-[#2C5F5D] text-[#EDE8E1] text-sm tracking-widest hover:bg-[#234948] transition-colors"
                >
                  VERSTUUR BERICHT
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C5F5D] text-[#EDE8E1] py-12">
        <div className="container mx-auto px-8 text-center">
          <div className="text-2xl font-heading mb-4">Brouwerij Zoeplap</div>
          <p className="text-sm text-[#EDE8E1]/60 tracking-wider">
            © 2024 Alle rechten voorbehouden
          </p>
          <p className="text-xs text-[#EDE8E1]/40 mt-2">
            Data van Untappd • Dagelijks bijgewerkt
          </p>
        </div>
      </footer>
    </div>
  );
}
