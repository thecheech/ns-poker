"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEE_NOTE_TYPES,
  PAYMENT_TYPE_HINTS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPES,
} from "@/lib/constants";
import type { PaymentMethod, PaymentType } from "@/lib/types";

interface PaymentMethodFieldProps {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  idPrefix?: string;
}

function paymentPlaceholder(type: PaymentType): string {
  if (type === "CRYPTO") return "0x...";
  if (type === "PAYPAL") return "paypal.me/you";
  return "@username";
}

export function PaymentMethodField({
  method,
  onChange,
  idPrefix = "payment",
}: PaymentMethodFieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>How you get paid</Label>
        <Select
          value={method.type}
          onValueChange={(value) =>
            onChange({
              type: value as PaymentType,
              value: value === "CASH" ? null : method.value,
            })
          }
        >
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="text-base">
                {PAYMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {method.type !== "CASH" ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-value`}>
            {PAYMENT_TYPE_HINTS[method.type]}
          </Label>
          <Input
            id={`${idPrefix}-value`}
            value={method.value ?? ""}
            onChange={(event) => onChange({ ...method, value: event.target.value })}
            placeholder={paymentPlaceholder(method.type)}
            className="h-12 text-base"
          />
          {FEE_NOTE_TYPES.includes(method.type) ? (
            <p className="text-xs text-muted-foreground">Sender covers fees.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Settle in cash at the table.</p>
      )}
    </div>
  );
}

export function paymentMethodToArray(method: PaymentMethod): PaymentMethod[] {
  return [method];
}
