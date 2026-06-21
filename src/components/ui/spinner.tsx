import { cn } from "@/lib/utils";

/** Simple spinning loader. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-line border-t-brand",
        className,
      )}
    />
  );
}
