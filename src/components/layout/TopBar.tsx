import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { AccountButton } from "@/components/auth/AccountButton";

/** Global top bar: wordmark, token search, account/balance. */
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-canvas px-4">
      <Logo />
      <div className="mx-auto w-full max-w-xl">
        <SearchBar />
      </div>
      <AccountButton />
    </header>
  );
}
