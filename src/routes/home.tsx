import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Heart,
  Award,
  Coffee,
  CheckCircle2,
  ChevronLeft,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import saladImg from "@/assets/salads.jpg";
import smoothieImg from "@/assets/smoothies.jpg";
import shotsImg from "@/assets/shots.jpg";
import bitesImg from "@/assets/quick-bites.jpg";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "About Saavic Healthy Café | Our Story & Kitchen Philosophy" },
      {
        name: "description",
        content:
          "Learn about Saavic Healthy Café in Secunderabad — our clean food philosophy, cold-pressed oils, zero refined sugars, mindful ambiance, and chef-curated wholesome recipes.",
      },
      { property: "og:title", content: "About Saavic Healthy Café" },
      {
        property: "og:description",
        content:
          "Mindful Food. Honest Kitchen. Fresh smoothies, protein salads, and healthy meals in Secunderabad.",
      },
    ],
  }),
  component: CafeHomePage,
});

function CafeHomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C211D] selection:bg-[#1B4D2E] selection:text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DE] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A6046] hover:text-[#163E24] px-2.5 py-1.5 rounded-full hover:bg-[#EDE9E1] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Landing</span>
            </Link>
            <div className="h-4 w-px bg-[#D9D3C7]" />
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo-monogram-green.png"
                alt="Saavic Logo"
                className="w-7 h-7 object-contain"
              />
              <div className="leading-tight">
                <span className="font-serif text-sm sm:text-base font-bold tracking-[2px] uppercase text-[#163E24] block">
                  SAAVIC
                </span>
                <span className="text-[9px] uppercase tracking-[1.5px] text-[#4A6046] font-semibold block">
                  HEALTHY CAFÉ
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button asChild size="sm" className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-xs font-bold px-4 py-2 shadow-xs">
              <Link to="/menu">
                <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                <span>View Menu & Order</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative py-12 sm:py-20 overflow-hidden border-b border-[#EAE5DA]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#EAF2EC]/60 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F2EDE2]/70 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2EC] border border-[#CDE1D2] text-xs font-bold uppercase tracking-[1.5px] text-[#1B4D2E] mb-5">
                <Sparkles className="w-3.5 h-3.5 text-[#1B4D2E]" />
                <span>About Saavic Healthy Café</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#163E24] leading-[1.12] tracking-tight">
                Mindful Food. Honest Kitchen.
                <br />
                <span className="font-normal italic text-[#4A6046]">Nourishing Secunderabad.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#4F584C] leading-relaxed">
                Saavic was born from a simple conviction: healthy eating should never feel restrictive, sterile, or bland. We craft wholesome, nutrient-dense meals that taste extraordinary and leave you feeling energized, clear-minded, and strong.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-sm font-bold px-7 py-3 shadow-md">
                  <Link to="/menu">
                    <span>Select Table & Order Now</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <a
                  href="#philosophy"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#C5BFB2] text-[#163E24] text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors"
                >
                  Our Food Philosophy ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. THE SAAVIC STORY */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#EAE5DA]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block">
                  OUR ORIGIN & ETHOS
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E24]">
                  Why We Built Saavic
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-[#4F584C] leading-relaxed">
                  <p>
                    Every day, thousands of health-conscious individuals in Hyderabad and Secunderabad struggle to find food that is genuinely clean. Traditional dine-out food is laden with palm oils, refined sugars, artificial flavor enhancers, and heavy preservatives.
                  </p>
                  <p>
                    We founded <strong>Saavic Healthy Café</strong> to provide an uncompromised sanctuary. Here, every dressing is whisked from extra virgin olive oil, every smoothie is cold-blended with natural fruits and plant protein, and every plate provides calibrated macros calculated by certified nutritionists.
                  </p>
                  <p>
                    Whether you are an athlete hitting personal records, a busy professional desiring mental clarity, or simply someone who appreciates authentic food, Saavic is your everyday kitchen.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-md aspect-4/5">
                    <img
                      src={saladImg}
                      alt="Fresh Salad Prep"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#EAE5DA] p-4 text-center">
                    <p className="font-serif font-bold text-2xl text-[#163E24]">100%</p>
                    <p className="text-xs text-[#5D665A] mt-1">Whole Foods & Natural Sourcing</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="rounded-2xl bg-[#EAF2EC] border border-[#CDE1D2] p-4 text-center">
                    <p className="font-serif font-bold text-2xl text-[#1B4D2E]">0%</p>
                    <p className="text-xs text-[#4A6046] mt-1">Refined Sugars & Artificial Preservatives</p>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-md aspect-4/5">
                    <img
                      src={smoothieImg}
                      alt="Fresh Superfood Smoothie"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. OUR 5 KITCHEN PRINCIPLES */}
        <section id="philosophy" className="py-14 sm:py-20 bg-[#FAF8F5] border-b border-[#EAE5DA]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block mb-2">
                UNCOMPROMISED STANDARDS
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E24]">
                The 5 Pillars of Our Kitchen
              </h2>
              <p className="text-sm text-[#5D665A] mt-3">
                Transparent food you can trust. We hold our kitchen to the highest standards of culinary integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Principle 1 */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:border-[#1B4D2E]/40 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl mb-4 font-serif font-bold">
                  01
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-2">
                  Zero Refined Sugar
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  We never use commercial white sugars or high-fructose corn syrups. All sweetness is derived from raw organic honey, black dates, figs, or pure jaggery.
                </p>
              </div>

              {/* Principle 2 */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:border-[#1B4D2E]/40 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl mb-4 font-serif font-bold">
                  02
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-2">
                  Cold-Pressed Oils Only
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  No palm oils, no hydrogenated fats, no reused fryer oils. We only cook and dress with wood-pressed sesame, coconut, and extra virgin olive oil.
                </p>
              </div>

              {/* Principle 3 */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:border-[#1B4D2E]/40 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl mb-4 font-serif font-bold">
                  03
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-2">
                  Macro-Balanced Nutrition
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  Every dish is calibrated with clean lean proteins (paneer, chicken breast, chickpeas), slow carbs (quinoa, millets), and digestive fibers.
                </p>
              </div>

              {/* Principle 4 */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:border-[#1B4D2E]/40 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl mb-4 font-serif font-bold">
                  04
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-2">
                  Live Made to Order
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  Zero pre-cooked warming trays and zero microwaving. When you order from your table, our chefs prepare your food fresh in our open kitchen.
                </p>
              </div>

              {/* Principle 5 */}
              <div className="bg-white rounded-2xl p-6 border border-[#E8E2D5] shadow-2xs hover:border-[#1B4D2E]/40 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl mb-4 font-serif font-bold">
                  05
                </div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-2">
                  Zero Additives or MSG
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  Pure natural flavors seasoned with rock salt, pink Himalayan salt, freshly ground pepper, and live aromatic garden herbs.
                </p>
              </div>

              {/* Bonus Card: 26-Day Meal Subscription */}
              <div className="bg-[#163E24] text-white rounded-2xl p-6 border border-[#2F6543] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#1B4D2E] text-[#88B04B] flex items-center justify-center text-xl mb-4">
                    ✨
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mb-2">
                    26-Day Transformation
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Subscribe to chef-curated daily wellness bowls tailored to your calorie and protein targets. Take the mental load off eating clean.
                  </p>
                </div>
                <Link
                  to="/menu"
                  className="text-xs font-bold text-[#88B04B] hover:text-white mt-4 flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Meal Plans</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. THE SPACE & AMBIANCE */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#EAE5DA]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block">
                  CALM & CONSCIOUS ENVIRONMENT
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#163E24]">
                  A Sanctuary to Recharge
                </h2>
                <p className="text-sm sm:text-base text-[#4F584C] leading-relaxed">
                  We designed our café space to be an extension of our food: calm, breathable, and restorative.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#5D665A]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Lush indoor plants and warm natural daylight</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Air-conditioned dine-in comfort with peaceful soundscapes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Work-friendly nooks with high-speed WiFi and power outlets</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Contactless QR table ordering with zero waiting in line</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden shadow-sm aspect-4/3">
                  <img
                    src={bitesImg}
                    alt="Saavic Healthy Bites"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-sm aspect-4/3">
                  <img
                    src={shotsImg}
                    alt="Immunity Booster Shots"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. GUEST TESTIMONIALS */}
        <section className="py-14 sm:py-20 bg-[#FAF8F5] border-b border-[#EAE5DA]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block mb-1.5">
                COMMUNITY FEEDBACK
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E24]">
                Loved by Clean Eaters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-[#EAE5DA] shadow-2xs">
                <p className="text-xs sm:text-sm text-[#4F584C] italic leading-relaxed">
                  &ldquo;Finally, a café in Secunderabad that doesn&apos;t hide sugars in smoothies or drown salads in mayo. The high-protein chicken bowl is a daily post-workout staple for me.&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <span className="font-serif font-bold text-xs text-[#163E24]">Rohan M.</span>
                  <span className="text-[10px] text-[#4A6046] font-semibold">Fitness Coach</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#EAE5DA] shadow-2xs">
                <p className="text-xs sm:text-sm text-[#4F584C] italic leading-relaxed">
                  &ldquo;The 26-day Veg Fit plan changed my energy levels completely. No afternoon slumps, honest clean fuel, and ordering from the table QR is effortless.&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <span className="font-serif font-bold text-xs text-[#163E24]">Pooja S.</span>
                  <span className="text-[10px] text-[#4A6046] font-semibold">Tech Consultant</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#EAE5DA] shadow-2xs">
                <p className="text-xs sm:text-sm text-[#4F584C] italic leading-relaxed">
                  &ldquo;The ginger-turmeric shots and cold-blended matcha smoothie are unmatched. Beautiful ambiance to sit with a laptop and get focused work done.&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                  <span className="font-serif font-bold text-xs text-[#163E24]">Karthik V.</span>
                  <span className="text-[10px] text-[#4A6046] font-semibold">Architect</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. LOCATION & HOURS */}
        <section className="py-12 bg-white border-b border-[#EAE5DA]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl bg-[#FAF8F5] border border-[#EAE5DA] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-md">
                <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block">
                  VISIT OUR CAFÉ
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#163E24]">
                  Saavic Healthy Café — Secunderabad
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-[#5D665A]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Secunderabad / Hyderabad, Telangana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1B4D2E] shrink-0" />
                    <span>Open Daily: 7:30 AM – 10:30 PM (All 7 Days)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button asChild size="lg" className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-xs sm:text-sm font-bold px-6 py-3 shadow-sm">
                  <Link to="/menu">
                    <UtensilsCrossed className="w-4 h-4 mr-2" />
                    <span>Select Table & Order</span>
                  </Link>
                </Button>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-white hover:bg-[#F2ECE1] border border-[#C5BFB2] text-[#163E24] text-xs sm:text-sm font-bold px-5 py-3 transition-colors"
                >
                  <MapPin className="w-4 h-4 mr-1.5 text-[#1B4D2E]" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 7. BIG PROMINENT BOTTOM CTA */}
        <section className="py-14 sm:py-20 bg-[#163E24] text-white text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
            <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#88B04B]">
              JOIN US AT THE TABLE
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to Taste the Clean Difference?
            </h2>
            <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
              Scan your table QR code or choose your table number to browse our full menu of smoothies, protein bowls, and wellness shots.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-[#88B04B] hover:bg-[#7aa042] text-[#163E24] font-bold text-sm px-8 py-3.5 shadow-lg">
                <Link to="/menu">
                  <span>Select Table & View Menu</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/40 text-white hover:bg-white/10 bg-transparent text-sm font-medium px-6 py-3.5">
                <Link to="/">Back to Landing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAF8F5] border-t border-[#EAE6DE] py-10 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center">
          <img
            src="/images/logo-monogram-green.png"
            alt="Saavic Logo"
            className="w-7 h-7 object-contain mb-2"
          />
          <span className="font-serif text-sm font-bold tracking-[2px] uppercase text-[#163E24]">
            SAAVIC HEALTHY CAFÉ
          </span>
          <p className="text-[11px] uppercase tracking-[1.5px] text-[#4A6046] font-semibold mt-1">
            EAT CLEAN • FEEL STRONG • LIVE BETTER
          </p>
          <div className="flex items-center gap-4 text-xs text-[#7A8277] mt-5">
            <Link to="/" className="hover:text-[#163E24] transition-colors">
              Landing Page
            </Link>
            <span>•</span>
            <Link to="/menu" className="hover:text-[#163E24] transition-colors">
              Table Menu
            </Link>
            <span>•</span>
            <Link to="/auth" className="hover:text-[#163E24] transition-colors">
              Staff Portal
            </Link>
          </div>
          <p className="text-[11px] text-[#9EA69B] mt-6">
            © {new Date().getFullYear()} SAAVIC HEALTHY CAFÉ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
