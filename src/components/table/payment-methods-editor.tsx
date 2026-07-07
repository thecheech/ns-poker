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
  CASH_CURRENCIES,
  CASH_CURRENCY_LABELS,
  CRYPTO_CHAINS,
  CRYPTO_CHAIN_LABELS,
  CRYPTO_TOKENS,
  CRYPTO_TOKEN_LABELS,
  FEE_NOTE_TYPES,
  PAYMENT_TYPE_HINTS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPES,
} from "@/lib/constants";
import { createEmptyPaymentMethod } from "@/lib/payments";
import type {
  CashCurrency,
  CryptoChain,
  CryptoToken,
  PaymentMethod,
  PaymentType,
} from "@/lib/types";

interface PaymentMethodsEditorProps {
  methods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
  idPrefix?: string;
  hideHeader?: boolean;
  compact?: boolean;
}

function paymentPlaceholder(type: PaymentType): string {
  if (type === "CRYPTO") return "0x… or wallet address";
  if (type === "PAYPAL") return "paypal.me/you";
  return "@username";
}

function resetMethodFields(type: PaymentType): Partial<PaymentMethod> {
  return {
    type,
    value: type === "CASH" ? null : null,
    chain: null,
    token: null,
    currency: null,
    link: null,
  };
}

export function PaymentMethodsEditor({
  methods,
  onChange,
  idPrefix = "payment",
  hideHeader = false,
  compact = false,
}: PaymentMethodsEditorProps) {
  const usedTypes = new Set(methods.map((method) => method.type));
  const availableTypes = PAYMENT_TYPES.filter((type) => !usedTypes.has(type));
  const inputClassName = compact ? "h-9 text-sm" : "h-12 text-base";
  const triggerClassName = compact ? "h-9 w-full text-sm" : "h-12 w-full text-base";

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
              {methods.length > 1 ? (
                <>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeMethod(index)}
                    aria-label="Remove method"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <Select
            value={method.type}
            onValueChange={(value) =>
              updateMethod(index, resetMethodFields(value as PaymentType))
            }
          >
            <SelectTrigger className={triggerClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  disabled={usedTypes.has(type) && method.type !== type}
                >
                  {PAYMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {method.type === "CRYPTO" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${idPrefix}-${index}-token`} className="text-xs">
                    Token
                  </Label>
                  <Select
                    value={method.token ?? ""}
                    onValueChange={(value) =>
                      updateMethod(index, {
                        token: value ? (value as CryptoToken) : null,
                      })
                    }
                  >
                    <SelectTrigger id={`${idPrefix}-${index}-token`} className={triggerClassName}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_TOKENS.map((token) => (
                        <SelectItem key={token} value={token}>
                          {CRYPTO_TOKEN_LABELS[token]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${idPrefix}-${index}-chain`} className="text-xs">
                    Chain
                  </Label>
                  <Select
                    value={method.chain ?? ""}
                    onValueChange={(value) =>
                      updateMethod(index, {
                        chain: value ? (value as CryptoChain) : null,
                      })
                    }
                  >
                    <SelectTrigger id={`${idPrefix}-${index}-chain`} className={triggerClassName}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_CHAINS.map((chain) => (
                        <SelectItem key={chain} value={chain}>
                          {CRYPTO_CHAIN_LABELS[chain]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-${index}-value`} className="text-xs">
                  {PAYMENT_TYPE_HINTS.CRYPTO}
                </Label>
                <Input
                  id={`${idPrefix}-${index}-value`}
                  value={method.value ?? ""}
                  onChange={(event) =>
                    updateMethod(index, { value: event.target.value })
                  }
                  placeholder={paymentPlaceholder("CRYPTO")}
                  className={inputClassName}
                />
              </div>
            </div>
          ) : null}

          {method.type === "CASH" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-${index}-currency`} className="text-xs">
                Currency
              </Label>
              <Select
                value={method.currency ?? ""}
                onValueChange={(value) =>
                  updateMethod(index, {
                    currency: value ? (value as CashCurrency) : null,
                  })
                }
              >
                <SelectTrigger id={`${idPrefix}-${index}-currency`} className={triggerClassName}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {CASH_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {CASH_CURRENCY_LABELS[currency]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PAYMENT_TYPE_HINTS.CASH}
              </p>
            </div>
          ) : null}

          {method.type !== "CASH" && method.type !== "CRYPTO" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-${index}-value`} className="text-xs">
                {PAYMENT_TYPE_HINTS[method.type]}
              </Label>
              <Input
                id={`${idPrefix}-${index}-value`}
                value={method.value ?? ""}
                onChange={(event) =>
                  updateMethod(index, { value: event.target.value })
                }
                placeholder={paymentPlaceholder(method.type)}
                className={inputClassName}
              />
              {FEE_NOTE_TYPES.includes(method.type) ? (
                <p className="text-xs text-muted-foreground">Sender covers fees.</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-${index}-link`} className="text-xs">
              Payment link
            </Label>
            <Input
              id={`${idPrefix}-${index}-link`}
              value={method.link ?? ""}
              onChange={(event) => updateMethod(index, { link: event.target.value })}
              placeholder="https://…"
              className={inputClassName}
            />
          </div>
        </div>
      ))}

      {availableTypes.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          className={compact ? "h-9 w-full text-sm" : "h-11 w-full"}
          onClick={addMethod}
        >
          <Plus className="size-4" />
          Add another method
        </Button>
      ) : null}
    </div>
  );
}
