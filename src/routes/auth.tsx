import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff login | Saavic Healthy Café" },
      { name: "description", content: "Secure sign-in for Saavic Healthy Café managers and kitchen staff." },
      { property: "og:title", content: "Staff login | Saavic Healthy Café" },
      { property: "og:description", content: "Secure sign-in for Saavic Healthy Café staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/admin", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4">
      <div className="w-full max-w-sm p-8 bg-white rounded-3xl border border-[#E8E2D5] shadow-md">
        <div className="mb-6 text-center">
          <img
            src="/images/logo-monogram-green.png"
            alt="Saavic Logo"
            className="mx-auto mb-2.5 h-10 w-10 object-contain"
          />
          <h1 className="font-serif text-2xl font-bold text-[#163E24]">Staff Portal</h1>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#7A8578] uppercase mt-1">
            Saavic Healthy Café
          </p>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[#3D473C]">Work email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="staff@saavic.cafe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-[#E8E2D5] text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#3D473C]">Password</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-[#E8E2D5] text-xs"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full bg-[#1B4D2E] hover:bg-[#143B23] text-white font-bold text-xs py-3 cursor-pointer shadow-xs"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign In to Staff Portal"}
          </Button>
        </form>

        <p className="text-[11px] text-center text-[#7A8578] mt-6 pt-4 border-t border-[#F0EBE1]">
          Staff accounts are provisioned by café management.
        </p>
      </div>
    </main>
  );
}
