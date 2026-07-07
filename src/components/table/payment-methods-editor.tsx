"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createEmptyPaymentMethod } from "@/lib/payments";
import type { PaymentMethod, PaymentType } from "@/lib/types";

interface PaymentMethodsEditorProps {
  methods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
  idPrefix?: string;
  hideHeader?: boolean;
}

function paymentPlaceholder(type: PaymentType): string {
  if (type === "CRYPTO") return "0x...";
  if (type === "PAYPAL") return "paypal.me/you";
  return "@username";
}

export function PaymentMethodsEditor({
  methods,
  onChange,
  idPrefix = "payment",
  hideHeader = false,
}: PaymentMethodsEditorProps) {
  const usedTypes = new Set(methods.map((method) => method.type));
  const availableTypes = PAYMENT_TYPES.filter((type) => !usedTypes.has(type));

  function updateMethod(index: number, patch: Partial<PaymentMethod>) {
    onChange(
      methods.map((method, methodIndex) =>
        methodIndex === index ? { ...method, ...patch } : method,
      ),
    );
  }

  function removeMethod(index: number) {
    onChange(methods.filter((_, methodIndex) => methodIndex !== index));
  }

  function moveMethod(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= methods.length) return;
    const next = [...methods];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  function addMethod() {
    const nextType = availableTypes[0] ?? "CASH";
    onChange([...methods, createEmptyPaymentMethod(nextType)]);
  }

  return (
    <div className="space-y-3">
      {!hideHeader ? (
        <div>
          <Label>How you pay / get paid</Label>
          <p className="text-sm text-muted-foreground">
            Add methods in order of preference. Payers try #1 first.
          </p>
        </div>
      ) : null}

      {methods.map((method, index) => (
        <div
          key={`${idPrefix}-${index}-${method.type}`}
          className="space-y-2 rounded-xl border bg-muted/20 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">#{index + 1}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => moveMethod(index, -1)}
                aria-label="Move up"
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === methods.length - 1}
                onClick={() => moveMethod(index, 1)}
                aria-label="Move down"
              >
                <ChevronDown className="size-4" />
              </Button>
              {methods.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMethod(index)}
                  aria-label="Remove method"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>

          <Select
            value={method.type}
            onValueChange={(value) =>
              updateMethod(index, {
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
                <SelectItem
                  key={type}
                  value={type}
                  disabled={usedTypes.has(type) && method.type !== type}
                  className="text-base"
                >
                  {PAYMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {method.type !== "CASH" ? (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-${index}-value`}>
                {PAYMENT_TYPE_HINTS[method.type]}
              </Label>
              <Input
                id={`${idPrefix}-${index}-value`}
                value={method.value ?? ""}
                onChange={(event) =>
                  updateMethod(index, { value: event.target.value })
                }
                placeholder={paymentPlaceholder(method.type)}
                className="h-12 text-base"
              />
              {FEE_NOTE_TYPES.includes(method.type) ? (
                <p className="text-xs text-muted-foreground">Sender covers fees.</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Settle in cash at the table.
            </p>
          )}
        </div>
      ))}

      {availableTypes.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={addMethod}
        >
          <Plus className="size-4" />
          Add another method
        </Button>
      ) : null}
    </div>
  );
}
