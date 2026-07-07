"use client";

import { useEffect, useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { updatePlayerPaymentMethodsAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { PaymentMethodEditor } from "@/components/table/payment-methods-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createEmptyPaymentMethod,
  primaryPaymentMethod,
  toPaymentMethods,
  validatePaymentMethods,
} from "@/lib/payments";
import type { PaymentMethod, Player } from "@/lib/types";

interface PaymentMethodSheetProps {
  slug: string;
  player: Player;
  onSaved: () => void;
}

function initialMethod(paymentMethods: PaymentMethod[]): PaymentMethod {
  return primaryPaymentMethod(paymentMethods) ?? createEmptyPaymentMethod("CRYPTO");
}

export function PaymentMethodSheet({ slug, player, onSaved }: PaymentMethodSheetProps) {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(
    initialMethod(player.paymentMethods),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setMethod(initialMethod(player.paymentMethods));
    }
  }, [open, player.paymentMethods]);

  function handleOpen() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }
    setOpen(true);
  }

  function handleSave() {
    const paymentMethods = toPaymentMethods(method);
    const error = validatePaymentMethods(paymentMethods);
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      try {
        await updatePlayerPaymentMethodsAction({
          slug,
          playerId: player.id,
          paymentMethods,
        });
        toast.success("Payment method saved");
        setOpen(false);
        onSaved();
      } catch (saveError) {
        toast.error(
          saveError instanceof Error ? saveError.message : "Could not save payment method",
        );
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={`Payment method for ${player.name}`}
        title="Payment method"
        onClick={handleOpen}
      >
        <Wallet className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="fixed inset-x-0 bottom-0 top-auto flex max-h-[min(90dvh,640px)] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none p-0 pb-[env(safe-area-inset-bottom)] ring-0 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(85vh,640px)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-0"
        >
          <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-4 text-left sm:px-6 sm:py-5">
            <DialogTitle className="text-base sm:text-lg">{player.name}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <PaymentMethodEditor
              method={method}
              onChange={setMethod}
              idPrefix={`${player.id}-payment`}
            />
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/30 px-4 py-4 sm:px-6 sm:py-4">
            <Button
              type="button"
              className="h-11 w-full text-base sm:h-10 sm:w-auto sm:min-w-28"
              onClick={handleSave}
              disabled={isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
