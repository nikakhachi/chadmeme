"use client";
/* eslint-disable @next/next/no-img-element -- static brand asset */
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoreBadges } from "./StoreBadges";

/** Sticky landing top bar — transparent over the hero, frosted once scrolled. */
export function LandingNav() {
  const { login } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-line bg-canvas/80 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/logo/dark.png"
            alt="ChadWallet"
            className="size-9 rounded-xl"
          />
          <span className="text-xl font-extrabold lowercase tracking-tight">
            chad<span className="text-brand">wallet</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <StoreBadges className="hidden lg:flex" />
          <Button onClick={login} variant="outline" size="md">
            Log in
          </Button>
        </div>
      </div>
    </header>
  );
}
