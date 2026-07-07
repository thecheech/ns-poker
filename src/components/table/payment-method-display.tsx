"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPaymentMethod, formatPaymentMethodCopyText } from "@/lib/format";
import { paymentMethodHasDetails } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/types";

interface PaymentMethodDisplayProps {
  recipientName: string;
  amountUsd: number;
  method: PaymentMethod | null;
  compact?: boolean;
}

export function PaymentMethodDisplay({
  recipientName,
  amountUsd,
  method,
  compact = false,
}: PaymentMethodDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = formatPaymentMethodCopyText(recipientName, amountUsd, method);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Payment details copied");
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

  return (
    <div className="space-y-2">
      <p className="text-xs leading-relaxed break-words text-muted-foreground">
        {formatPaymentMethod(method)}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full text-xs sm:w-auto"
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy payment details"}
      </Button>
    </div>
  );
}
