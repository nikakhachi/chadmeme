"use client";
import { useState } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { BalancePills } from "@/components/ui/balance-pills";
import { useProfile } from "@/hooks/use-profile";

/** Top-bar account control: log in, or balance + menu when authenticated. */
export function AccountButton() {
  const { ready, authenticated, login, logout } = useAuth();
  const { username, avatarUrl } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ready) {
    return <div className="h-10 w-24 animate-pulse rounded-lg bg-panel" />;
  }

  if (!authenticated) {
    return (
      <Button onClick={login} size="md">
        Log in
      </Button>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      <BalancePills className="hidden sm:flex" />
      <button
        onClick={() => setMenuOpen((o) => !o)}
        onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-full bg-elevated p-1 pr-2"
      >
        <TokenAvatar
          symbol={username}
          logoURI={avatarUrl ?? undefined}
          size="sm"
          className="size-8"
        />
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
          {username}
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-xl">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-elevated"
          >
            <User className="size-4" /> Your profile
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-down hover:bg-elevated"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
