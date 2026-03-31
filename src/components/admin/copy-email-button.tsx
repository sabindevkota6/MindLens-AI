"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CopyEmailButton({ email }: { email: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(email);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
      onClick={copy}
      title="Copy email"
    >
      {done ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
