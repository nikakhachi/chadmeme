import { TopBar } from "@/components/layout/TopBar";
import { TokenSidebar } from "@/components/layout/TokenSidebar";

/**
 * App shell: fixed top bar, scrollable token sidebar, and the routed center +
 * right-rail content. The sidebar is hidden on small screens.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">
          <TokenSidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
