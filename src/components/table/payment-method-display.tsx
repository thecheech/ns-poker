"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatPaymentMethod,
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

  if (visibleMethods.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No payment details yet</p>
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
    <div className="space-y-2">
      <ul className="space-y-1">
        {visibleMethods.map((method, index) => (
          <li
            key={`${method.type}-${index}`}
            className="text-xs leading-relaxed text-muted-foreground"
          >
            <span className="font-medium text-foreground/80">#{index + 1}</span>{" "}
            <span className="break-words">{formatPaymentMethod(method)}</span>
          </li>
        ))}
      </ul>
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
