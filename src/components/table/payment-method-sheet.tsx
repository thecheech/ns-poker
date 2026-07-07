"use client";

import { useEffect, useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { updatePlayerPaymentMethodsAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { PaymentMethodsEditor } from "@/components/table/payment-methods-editor";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { validatePaymentMethods } from "@/lib/payments";
import type { PaymentMethod, Player } from "@/lib/types";

interface PaymentMethodSheetProps {
  slug: string;
  player: Player;
  onSaved: () => void;
}

export function PaymentMethodSheet({ slug, player, onSaved }: PaymentMethodSheetProps) {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>(player.paymentMethods);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setMethods(player.paymentMethods);
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
    const error = validatePaymentMethods(methods);
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      try {
        await updatePlayerPaymentMethodsAction({
          slug,
          playerId: player.id,
          paymentMethods: methods,
        });
        toast.success("Payment methods saved");
        setOpen(false);
        onSaved();
      } catch (saveError) {
        toast.error(
          saveError instanceof Error ? saveError.message : "Could not save payment methods",
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
        aria-label={`Payment methods for ${player.name}`}
        title="Payment methods"
        onClick={handleOpen}
      >
        <Wallet className="size-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{player.name}</SheetTitle>
            <SheetDescription>
              How to pay {player.name}. All fields are optional.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-2">
            <PaymentMethodsEditor
              methods={methods}
              onChange={setMethods}
              idPrefix={`${player.id}-payment`}
              hideHeader
              compact
            />
          </div>

          <SheetFooter className="border-t border-border/60">
            <Button
              type="button"
              className="h-10 w-full"
              onClick={handleSave}
              disabled={isPending}
            >
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
