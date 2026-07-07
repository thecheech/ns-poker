"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPaymentMethod, paymentMethodCopyValue } from "@/lib/format";
import { paymentMethodHasDetails } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/types";

interface PaymentMethodDisplayProps {
  recipientName: string;
  amountUsd: number;
  method: PaymentMethod | null;
  compact?: boolean;
}

export function PaymentMethodDisplay({
  method,
  compact = false,
}: PaymentMethodDisplayProps) {
  const [copied, setCopied] = useState(false);
  const copyValue = paymentMethodCopyValue(method);

  async function handleCopy() {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!method || !paymentMethodHasDetails(method)) {
    return (
      <p className="text-xs text-muted-foreground">No payment details yet</p>
    );
  }

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {formatPaymentMethod(method)}
        </p>
        {copyValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Copy address"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs leading-relaxed break-words text-muted-foreground">
        {formatPaymentMethod(method)}
      </p>
      {copyValue ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full text-xs sm:w-auto"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy address"}
        </Button>
      ) : null}
    </div>
  );
}
