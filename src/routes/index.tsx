import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Utensils,
  MapPin,
  X,
  QrCode,
  Salad,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WellnessWelcomeModal } from "@/components/customer/WellnessWelcomeModal";
import { TablePickerModal } from "@/components/customer/TablePickerModal";

import saladImg from "@/assets/salads.jpg";
import smoothieImg from "@/assets/smoothies.jpg";
import shotsImg from "@/assets/shots.jpg";
import bitesImg from "@/assets/quick-bites.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saavic Healthy Café | Eat Clean, Feel Strong, Live Better" },
      {
        name: "description",
        content:
          "Saavic Healthy Café in Secunderabad — fresh superfood smoothies, protein salads, wellness shots and 26-day clean meal plans. Scan your table QR or order online.",
      },
      { property: "og:title", content: "Saavic Healthy Café" },
      {
        property: "og:description",
        content:
          "Eat Clean • Feel Strong • Live Better. Fresh smoothies, protein salads and wellness shots in Secunderabad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const router = useRouter();
  const [showTableModal, setShowTableModal] = useState(false);

  const handleSelectTable = (slug: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("saavic:last-table", slug);
    }
    router.navigate({ to: "/menu", search: { table: slug } });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C211D] selection:bg-[#1B4D2E] selection:text-white flex flex-col justify-between">
      {/* Soft Welcome Modal on initial visit */}
      <WellnessWelcomeModal onEnter={() => setShowTableModal(true)} />

      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DE] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo + Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <img
                src="/images/logo-monogram-green.png"
                alt="Saavic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-serif text-base sm:text-lg font-bold tracking-[2.5px] uppercase block text-[#163E24] leading-none">
                SAAVIC
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[2px] text-[#4A6046] font-semibold block mt-0.5">
                HEALTHY CAFÉ
              </span>
            </div>
          </Link>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/home"
              className="text-xs font-semibold text-[#4A6046] hover:text-[#163E24] px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-[#EDE9E1] transition-colors flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">About</span>
            </Link>

            <button
              onClick={() => setShowTableModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDE9E1] hover:bg-[#E3DED4] text-[#3D473B] text-xs font-medium transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#1B4D2E]" />
              <span>Select Table</span>
              <span className="text-[10px] text-[#637060]">▾</span>
            </button>

            <Button
              size="sm"
              onClick={() => setShowTableModal(true)}
              className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <span>Order Now</span>
            </Button>

            <Link
              to="/auth"
              className="hidden sm:inline-block text-[11px] font-semibold text-[#667262] hover:text-[#163E24] px-1.5 py-1 transition-colors"
              title="Staff Access"
            >
              Staff
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. HERO SECTION */}
        <section className="relative pt-8 sm:pt-14 pb-12 sm:pb-20 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#E8F0EA]/60 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#F2EDE2]/70 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
              {/* Left Column: Narrative & CTAs */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2EC] border border-[#CDE1D2] text-[11px] font-bold tracking-[1.5px] uppercase text-[#1B4D2E]">
                  <Sparkles className="w-3 h-3 text-[#1B4D2E]" />
                  <span>Wellness Café & Clean Kitchen</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-[#163E24] leading-[1.08] tracking-tight">
                  EAT CLEAN.
                  <br />
                  <span className="font-normal italic text-[#4A6046]">FEEL STRONG.</span>
                  <br />
                  LIVE BETTER.
                </h1>

                <p className="text-sm sm:text-base text-[#4F584C] max-w-lg leading-relaxed">
                  Welcome to Saavic Healthy Café. We craft nutrient-dense bowls, cold-blended superfood smoothies, and chef-curated wholesome meals with zero refined sugar and cold-pressed oils.
                </p>

                {/* The Two Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {/* Button 1: Redirects to /home (Information about the cafe) */}
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white text-xs sm:text-sm font-bold tracking-wider uppercase px-7 py-3.5 shadow-md hover:shadow-lg transition-all"
                  >
                    <Link to="/home">
                      <span>Explore Our Café</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  {/* Button 2: Opens table selection to order */}
                  <Button
                    onClick={() => setShowTableModal(true)}
                    variant="outline"
                    size="lg"
                    className="rounded-full bg-white hover:bg-[#F2ECE1] border border-[#C5BFB2] text-[#163E24] text-xs sm:text-sm font-bold tracking-wider uppercase px-6 py-3.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 mr-2 text-[#1B4D2E]" />
                    <span>Order at Table</span>
                  </Button>
                </div>


                {/* Fast micro-guarantees */}
                <div className="flex items-center gap-6 pt-2 text-xs text-[#637060]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D2E]" />
                    <span>No login required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#1B4D2E]" />
                    <span>Freshly made to order</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1B4D2E]" />
                    <span>Instant table service</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Food Imagery */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-sm sm:max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-xl border border-[#E8E4DC]">
                  <img
                    src={saladImg}
                    alt="Fresh Saavic Healthy Nourish Bowl"
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-700"
                  />

                  {/* Floating Micro-Badge on Image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-[#E8E4DC] shadow-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center shrink-0 text-lg">
                      🌿
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#163E24] leading-snug">
                        Signature Avocado & Superfood Bowl
                      </p>
                      <p className="text-[10px] text-[#556152] truncate">
                        Cold-pressed olive oil · Microgreens · Organic Quinoa
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#1B4D2E] shrink-0">
                      ₹249
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PHILOSOPHY STRIP */}
        <section className="py-12 sm:py-16 bg-[#F3EFE6]/70 border-y border-[#E8E2D5]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block mb-1.5">
                THE SAAVIC PHILOSOPHY
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E24]">
                Mindful Food. Honest Ingredients.
              </h2>
              <p className="text-xs sm:text-sm text-[#5D665A] mt-2">
                Every dish is crafted with purpose to nourish your body, fuel high energy, and celebrate real wholesome flavor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-[#E6E1D4] shadow-2xs hover:border-[#1B4D2E]/30 transition-all">
                <div className="text-2xl mb-3 select-none">🌿</div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-1.5">
                  Clean Ingredients
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  100% whole foods, zero chemical preservatives, zero refined white sugars, and only cold-pressed oils.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E6E1D4] shadow-2xs hover:border-[#1B4D2E]/30 transition-all">
                <div className="text-2xl mb-3 select-none">💪</div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-1.5">
                  Balanced Nutrition
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  Macro-balanced meals with clean lean proteins, complex healthy carbs, and gut-loving fiber.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E6E1D4] shadow-2xs hover:border-[#1B4D2E]/30 transition-all">
                <div className="text-2xl mb-3 select-none">👨‍🍳</div>
                <h3 className="font-serif text-lg font-bold text-[#163E24] mb-1.5">
                  Chef Prepared Fresh
                </h3>
                <p className="text-xs text-[#5D665A] leading-relaxed">
                  Never pre-packaged or sitting in warming trays. Every bowl, plate, and smoothie is made right as you order.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4D2E] hover:text-[#143B23] uppercase tracking-wider"
              >
                <span>Read our complete food story</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 4. SIGNATURE CATEGORIES PREVIEW */}
        <section className="py-12 sm:py-18">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#1B4D2E] block mb-1">
                  OUR CRAFTED MENU
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#163E24]">
                  Signature Categories
                </h2>
              </div>
              <Link
                to="/menu"
                className="text-xs font-bold text-[#1B4D2E] hover:text-[#123620] flex items-center gap-1 group"
              >
                <span>View complete menu & order</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category 1: Smoothies */}
              <Link
                to="/menu"
                className="group bg-white rounded-2xl overflow-hidden border border-[#EAE5DA] shadow-2xs hover:shadow-md hover:border-[#1B4D2E]/40 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={smoothieImg}
                    alt="Superfood Smoothies"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-[#163E24]">
                    Cold-Blended
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#163E24] group-hover:text-[#1B4D2E] transition-colors">
                      Superfood Smoothies
                    </h3>
                    <p className="text-xs text-[#5D665A] mt-1 line-clamp-2">
                      Berry chia, avocado matcha, and plant protein blends crafted for recovery.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-bold text-[#1B4D2E]">
                    <span>From ₹179</span>
                    <span className="group-hover:translate-x-1 transition-transform">Explore →</span>
                  </div>
                </div>
              </Link>

              {/* Category 2: Salads & Bowls */}
              <Link
                to="/menu"
                className="group bg-white rounded-2xl overflow-hidden border border-[#EAE5DA] shadow-2xs hover:shadow-md hover:border-[#1B4D2E]/40 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={saladImg}
                    alt="Healthy Bowls & Salads"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-[#163E24]">
                    Nutrient Dense
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#163E24] group-hover:text-[#1B4D2E] transition-colors">
                      Nourish Bowls & Salads
                    </h3>
                    <p className="text-xs text-[#5D665A] mt-1 line-clamp-2">
                      Crisp microgreens, organic quinoa, slow-roasted nuts, and olive dressing.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-bold text-[#1B4D2E]">
                    <span>From ₹199</span>
                    <span className="group-hover:translate-x-1 transition-transform">Explore →</span>
                  </div>
                </div>
              </Link>

              {/* Category 3: Plates & Quick Bites */}
              <Link
                to="/menu"
                className="group bg-white rounded-2xl overflow-hidden border border-[#EAE5DA] shadow-2xs hover:shadow-md hover:border-[#1B4D2E]/40 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={bitesImg}
                    alt="High-Protein Plates"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-[#163E24]">
                    High Protein
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#163E24] group-hover:text-[#1B4D2E] transition-colors">
                      High-Protein Plates
                    </h3>
                    <p className="text-xs text-[#5D665A] mt-1 line-clamp-2">
                      Herb-grilled chicken, cottage cheese steak, quinoa wraps, and clean macros.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-bold text-[#1B4D2E]">
                    <span>From ₹249</span>
                    <span className="group-hover:translate-x-1 transition-transform">Explore →</span>
                  </div>
                </div>
              </Link>

              {/* Category 4: Wellness Shots */}
              <Link
                to="/menu"
                className="group bg-white rounded-2xl overflow-hidden border border-[#EAE5DA] shadow-2xs hover:shadow-md hover:border-[#1B4D2E]/40 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={shotsImg}
                    alt="Wellness Shots & Elixirs"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-[#163E24]">
                    Cold Pressed
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#163E24] group-hover:text-[#1B4D2E] transition-colors">
                      Wellness Shots & Elixirs
                    </h3>
                    <p className="text-xs text-[#5D665A] mt-1 line-clamp-2">
                      Pure ginger turmeric, raw wheatgrass, amla immunity, and detox tonics.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-bold text-[#1B4D2E]">
                    <span>From ₹79</span>
                    <span className="group-hover:translate-x-1 transition-transform">Explore →</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. 26-DAY MEAL PLAN SPOTLIGHT */}
        <section className="py-12 bg-[#163E24] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#1B4D2E] rounded-3xl p-6 sm:p-10 border border-[#2F6543] shadow-lg relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-8 space-y-3">
                  <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#88B04B] bg-[#123620] px-3 py-1 rounded-full inline-block border border-[#2F6543]">
                    TRANSFORM IN 26 DAYS
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                    26 Days of Clean Eating Subscription
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                    Take the guesswork out of healthy living. 26 days of curated, chef-prepared wholesome meals crafted by nutritionists to boost daily vitality and lean muscle.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="bg-[#123620]/80 border border-[#2F6543] rounded-xl px-3.5 py-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#88B04B] block">
                        VEG FIT PLAN
                      </span>
                      <span className="text-base font-serif font-bold text-white">
                        ₹3,999 <span className="text-[11px] font-normal text-white/70">/ 26 meals</span>
                      </span>
                    </div>

                    <div className="bg-[#123620]/80 border border-[#2F6543] rounded-xl px-3.5 py-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#88B04B] block">
                        CHICKEN FIT PLAN
                      </span>
                      <span className="text-base font-serif font-bold text-white">
                        ₹4,999 <span className="text-[11px] font-normal text-white/70">/ 26 meals</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center">
                  <Button asChild size="lg" className="w-full md:w-auto rounded-full bg-white text-[#163E24] hover:bg-[#F2ECE1] text-xs font-bold uppercase tracking-wider shadow-md">
                    <Link to="/menu">
                      <span>Explore 26-Day Plans</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                  <p className="text-[11px] text-white/60 mt-2 text-center md:text-right">
                    Dine-in or daily takeaway available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. EDITORIAL AMBIANCE & LOCATION STRIP */}
        <section className="py-10 bg-[#FAF8F5]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-white border border-[#EAE5DA] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] text-[#1B4D2E] flex items-center justify-center text-xl shrink-0">
                  <MapPin className="w-6 h-6 text-[#1B4D2E]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#163E24]">
                    Saavic Healthy Café — Secunderabad
                  </h4>
                  <p className="text-xs text-[#5D665A] mt-0.5">
                    Secunderabad / Hyderabad · Open Daily 7:30 AM – 10:30 PM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="sm" className="rounded-full border-[#C5BFB2] text-[#163E24]">
                  <Link to="/home">About Our Story</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowTableModal(true)}
                  className="rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white font-bold uppercase tracking-wider text-xs cursor-pointer"
                >
                  Order from Table
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
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

          <p className="text-xs text-[#7A8277] mt-4 max-w-sm">
            Fresh, healthy, and conscious dining designed to fuel your day in Secunderabad.
          </p>

          <div className="flex items-center gap-4 text-xs text-[#7A8277] mt-4">
            <Link to="/home" className="hover:text-[#163E24] transition-colors">
              About Café
            </Link>
            <span>•</span>
            <button
              onClick={() => setShowTableModal(true)}
              className="hover:text-[#163E24] transition-colors cursor-pointer"
            >
              Table Menu
            </button>
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

      {/* Real-time Table Selection Modal */}
      <TablePickerModal
        open={showTableModal}
        onOpenChange={setShowTableModal}
        onSelect={handleSelectTable}
      />
    </div>
  );
}
