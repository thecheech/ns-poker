"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatPaymentMethodShort,
  formatPaymentMethodsCopyText,
} from "@/lib/format";
import { paymentMethodHasDetails } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/types";

interface PaymentMethodDisplayProps {
  recipientName: string;
  amountUsd: number;
  methods: PaymentMethod[];
}

export function PaymentMethodDisplay({
  recipientName,
  amountUsd,
  methods,
}: PaymentMethodDisplayProps) {
  const [copied, setCopied] = useState(false);
  const visibleMethods = methods.filter(paymentMethodHasDetails);
  const primary = visibleMethods[0] ?? methods[0];
  const primaryLabel = primary ? formatPaymentMethodShort(primary) : null;

  if (!primary) {
    return (
      <p className="truncate text-xs text-muted-foreground">No payment details yet</p>
    );
  }

  async function handleCopy() {
    const text = formatPaymentMethodsCopyText(recipientName, amountUsd, methods);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Payment details copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        {primaryLabel ?? "Payment details added"}
        {visibleMethods.length > 1 ? ` · +${visibleMethods.length - 1}` : null}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Copy payment details"
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
    </div>
  );
}
