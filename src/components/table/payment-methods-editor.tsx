"use client";

import { ClipboardPaste, Plus, X } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
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

interface PaymentMethodEditorProps {
  method: PaymentMethod | null;
  onChange: (method: PaymentMethod | null) => void;
  idPrefix?: string;
}

function paymentPlaceholder(type: PaymentType): string {
  if (type === "CRYPTO") return "0x… or wallet address";
  if (type === "PAYPAL") return "paypal.me/you";
  return "@username";
}

function resetMethodFields(type: PaymentType): PaymentMethod {
  return createEmptyPaymentMethod(type);
}

interface TextInputWithPasteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "text" | "url";
}

function TextInputWithPaste({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
}: TextInputWithPasteProps) {
  async function handlePaste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        toast.error("Clipboard is empty");
        return;
      }
      onChange(text);
    } catch {
      toast.error("Could not paste from clipboard");
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs sm:text-sm">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 text-base sm:h-11 sm:text-sm"
          inputMode={inputMode}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 gap-1.5 px-3 text-xs sm:h-11"
          onClick={handlePaste}
          aria-label={`Paste ${label.toLowerCase()}`}
        >
          <ClipboardPaste className="size-3.5" />
          Paste
        </Button>
      </div>
    </div>
  );
}

export function PaymentMethodEditor({
  method,
  onChange,
  idPrefix = "payment",
}: PaymentMethodEditorProps) {
  const inputClassName = "h-10 text-base sm:h-11 sm:text-sm";
  const triggerClassName = "h-10 w-full text-base sm:h-11 sm:text-sm";

  function updateMethod(patch: Partial<PaymentMethod>) {
    if (!method) return;
    onChange({ ...method, ...patch });
  }

  if (!method) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full text-sm sm:h-11"
        onClick={() => onChange(createEmptyPaymentMethod("CRYPTO"))}
      >
        <Plus className="size-4" />
        Add payment method
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:space-y-4 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium sm:text-base">
          {PAYMENT_TYPE_LABELS[method.type]}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(null)}
          aria-label="Remove payment method"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-type`} className="text-xs sm:text-sm">
          Type
        </Label>
        <Select
          value={method.type}
          onValueChange={(value) => onChange(resetMethodFields(value as PaymentType))}
        >
          <SelectTrigger id={`${idPrefix}-type`} className={triggerClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {PAYMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {method.type === "CRYPTO" ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-token`} className="text-xs sm:text-sm">
                Token
              </Label>
              <Select
                value={method.token ?? ""}
                onValueChange={(value) =>
                  updateMethod({
                    token: value ? (value as CryptoToken) : null,
                  })
                }
              >
                <SelectTrigger id={`${idPrefix}-token`} className={triggerClassName}>
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
              <Label htmlFor={`${idPrefix}-chain`} className="text-xs sm:text-sm">
                Chain
              </Label>
              <Select
                value={method.chain ?? ""}
                onValueChange={(value) =>
                  updateMethod({
                    chain: value ? (value as CryptoChain) : null,
                  })
                }
              >
                <SelectTrigger id={`${idPrefix}-chain`} className={triggerClassName}>
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
          <TextInputWithPaste
            id={`${idPrefix}-value`}
            label={PAYMENT_TYPE_HINTS.CRYPTO}
            value={method.value ?? ""}
            onChange={(value) => updateMethod({ value })}
            placeholder={paymentPlaceholder("CRYPTO")}
          />
        </div>
      ) : null}

      {method.type === "CASH" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-currency`} className="text-xs sm:text-sm">
            Currency
          </Label>
          <Select
            value={method.currency ?? ""}
            onValueChange={(value) =>
              updateMethod({
                currency: value ? (value as CashCurrency) : null,
              })
            }
          >
            <SelectTrigger id={`${idPrefix}-currency`} className={triggerClassName}>
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
          <p className="text-xs text-muted-foreground sm:text-sm">
            {PAYMENT_TYPE_HINTS.CASH}
          </p>
        </div>
      ) : null}

      {method.type !== "CASH" && method.type !== "CRYPTO" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-value`} className="text-xs sm:text-sm">
            {PAYMENT_TYPE_HINTS[method.type]}
          </Label>
          <Input
            id={`${idPrefix}-value`}
            value={method.value ?? ""}
            onChange={(event) => updateMethod({ value: event.target.value })}
            placeholder={paymentPlaceholder(method.type)}
            className={inputClassName}
          />
          {FEE_NOTE_TYPES.includes(method.type) ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              Sender covers fees.
            </p>
          ) : null}
        </div>
      ) : null}

      {method.type !== "CASH" && method.type !== "CRYPTO" ? (
        <TextInputWithPaste
          id={`${idPrefix}-link`}
          label="Payment link"
          value={method.link ?? ""}
          onChange={(link) => updateMethod({ link })}
          placeholder="https://…"
          inputMode="url"
        />
      ) : null}
    </div>
  );
}
