"use client";

import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareLinkButtonProps {
  slug: string;
  tableName?: string | null;
}

function buildShareMessage(url: string, tableName?: string | null): string {
  const label = tableName?.trim() || "our poker table";
  return `Join ${label} on NS Poker:\n${url}`;
}

function useTableUrl(slug: string): string {
  const [url, setUrl] = useState(`/t/${slug}`);

  useEffect(() => {
    setUrl(`${window.location.origin}/t/${slug}`);
  }, [slug]);

  return url;
}

export function CopyTableLinkButton({ slug, tableName }: ShareLinkButtonProps) {
  const url = useTableUrl(slug);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!url.startsWith("http")) return;

    await navigator.clipboard.writeText(buildShareMessage(url, tableName));
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 flex-1 text-base"
      onClick={handleCopy}
      disabled={!url.startsWith("http")}
    >
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

export function ShareLinkButton({ slug, tableName }: ShareLinkButtonProps) {
  const url = useTableUrl(slug);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!url.startsWith("http")) return;

    await navigator.clipboard.writeText(buildShareMessage(url, tableName));
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!url.startsWith("http")) return;

    const message = buildShareMessage(url, tableName);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "NS Poker",
          text: message,
        });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    await handleCopy();
  }

  return (
    <div className="space-y-2 rounded-2xl border bg-card p-3">
      <p className="text-sm font-medium">Share link</p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          aria-label="Table link"
          className="h-11 min-w-0 flex-1 font-mono text-sm text-muted-foreground"
          onFocus={(event) => event.target.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={handleCopy}
          disabled={!url.startsWith("http")}
          aria-label="Copy link"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-full text-base"
        onClick={handleShare}
        disabled={!url.startsWith("http")}
      >
        <Share2 className="size-4" />
        Share table link
      </Button>
    </div>
  );
}

export function CopyLinkButton({ slug, tableName }: ShareLinkButtonProps) {
  const url = useTableUrl(slug);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!url.startsWith("http")) return;

    await navigator.clipboard.writeText(buildShareMessage(url, tableName));
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={!url.startsWith("http")}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
