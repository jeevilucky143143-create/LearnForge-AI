import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
    </div>
  );
}
