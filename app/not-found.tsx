import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-lg rounded-3xl border border-border bg-background p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            404 not found
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            We could not find that page
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            The link may be outdated, or the page might be moving. Head back to
            the LabTrackSimple home page to continue.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
