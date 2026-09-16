import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, QrCode, Salad, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/salads.jpg";
import smoothieImg from "@/assets/smoothies.jpg";
import shotsImg from "@/assets/shots.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saavic Healthy Café | Eat Clean, Feel Strong, Live Better" },
      {
        name: "description",
        content:
          "Saavic Healthy Café in Secunderabad — fresh smoothies, protein salads, wellness shots and 26-day clean meal plans. Scan your table QR to order.",
      },
      { property: "og:title", content: "Saavic Healthy Café" },
      {
        property: "og:description",
        content: "Fresh smoothies, protein salads and wellness shots. Scan your table QR to order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient px-6 py-16 text-center text-primary-foreground">
        <Leaf className="mx-auto mb-4 h-8 w-8" aria-hidden />
        <p className="brand-wordmark text-4xl font-semibold">Saavic</p>
        <p className="mt-1 text-sm tracking-[0.3em]">HEALTHY CAFÉ</p>
        <h1 className="mt-6 font-display text-3xl">Eat Clean • Feel Strong • Live Better</h1>
        <p className="mx-auto mt-3 max-w-md text-sm opacity-90">
          Fresh food. Simple ordering. Scan the QR code on your table to browse the menu and order.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary" size="lg">
            <Link to="/t/$slug" params={{ slug: "table-01" }}>
              <QrCode className="mr-2 h-4 w-4" aria-hidden /> Try Table 01 menu
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-transparent">
            <Link to="/auth">Staff login</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { img: smoothieImg, title: "Smoothies", text: "Cold-blended, no refined sugar." },
            { img: heroImg, title: "Protein salads", text: "Paneer, chickpea and chicken bowls." },
            { img: shotsImg, title: "Wellness shots", text: "Daily immunity and detox boosters." },
          ].map((c) => (
            <article key={c.title} className="surface-card overflow-hidden">
              <img src={c.img} alt={c.title} loading="lazy" width={816} height={816} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h2 className="font-display text-lg">{c.title}</h2>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="surface-card leaf-gradient mt-10 p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden />
          <h2 className="font-display text-2xl">26 Days of Clean, High-Protein Meals</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your daily dose of health. Zero stress.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="surface-card p-4">
              <Salad className="mx-auto mb-1 h-5 w-5 text-primary" aria-hidden />
              <p className="font-display text-lg">Veg Fit</p>
              <p className="text-sm text-muted-foreground">26 days · 20–25g protein daily</p>
              <p className="mt-1 font-semibold text-primary">₹3,999</p>
            </div>
            <div className="surface-card p-4">
              <Salad className="mx-auto mb-1 h-5 w-5 text-primary" aria-hidden />
              <p className="font-display text-lg">Chicken Fit</p>
              <p className="text-sm text-muted-foreground">26 days · 30–40g protein daily</p>
              <p className="mt-1 font-semibold text-primary">₹4,999</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p className="brand-wordmark text-base font-semibold text-foreground">Saavic Healthy Café</p>
        <p className="mt-1 text-xs tracking-widest">EAT CLEAN • FEEL STRONG • LIVE BETTER</p>
        <p className="mt-2">Secunderabad, Hyderabad, Telangana</p>
      </footer>
    </div>
  );
}
