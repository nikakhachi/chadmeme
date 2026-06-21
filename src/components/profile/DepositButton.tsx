"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowDownToLine } from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CopyAddress } from "@/components/ui/copy-address";
import { SolIcon } from "@/components/ui/asset-icon";

/**
 * "Deposit" button that opens a modal with the user's Solana wallet address as
 * a QR code + copyable text. Funds sent here arrive in the embedded wallet.
 */
export function DepositButton() {
  const { walletAddress, isMock } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowDownToLine className="size-4" />
        Deposit
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Deposit with crypto"
      >
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-xs font-semibold text-brand">
            <SolIcon className="size-3.5" />
            Solana network
          </span>
          <p className="mb-4 text-sm text-muted">
            Send <span className="text-foreground">SOL</span> or{" "}
            <span className="text-foreground">USDC</span> on Solana to the
            address below. Only send Solana assets — anything else may be lost.
          </p>

          {walletAddress ? (
            <>
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={walletAddress} size={176} marginSize={0} />
              </div>
              <div className="mt-4 w-full rounded-lg border border-line bg-canvas px-3 py-2.5">
                <div className="mb-1 text-xs text-muted">
                  Your Solana address
                </div>
                <CopyAddress address={walletAddress} />
              </div>
              {isMock && (
                <p className="mt-3 text-xs text-subtle">
                  Demo mode: placeholder address. Connect Privy for a real
                  wallet.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              Log in to generate a wallet address.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
