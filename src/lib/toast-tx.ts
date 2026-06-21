import { toast } from "sonner";

/** Success toast for an on-chain transaction, with a "View on Solscan" action. */
export function toastTx(message: string, signature: string, description?: string) {
  toast.success(message, {
    description,
    action: {
      label: "View",
      onClick: () => window.open(`https://solscan.io/tx/${signature}`, "_blank"),
    },
  });
}
