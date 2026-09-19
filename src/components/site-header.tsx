"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Contrast, HeartPulse, Stethoscope, UserRound, ZoomIn } from "lucide-react";
import { useA11y } from "@/components/a11y-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/my-id", label: "My Medical ID", icon: UserRound },
  { href: "/doctor", label: "Doctor mode", icon: Stethoscope },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { prefs, setPref } = useA11y();

  return (
    <header className="no-print border-b bg-card">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md py-2 text-xl font-semibold"
        >
          <HeartPulse className="size-7 text-primary" aria-hidden="true" />
          Cadence
        </Link>

        <nav aria-label="Main" className="flex gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-2 rounded-md px-3 py-2 font-medium hover:bg-secondary",
                  active && "bg-secondary underline decoration-2 underline-offset-4"
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <fieldset className="ml-auto flex flex-wrap items-center gap-4">
          <legend className="sr-only">Display settings</legend>
          <div className="flex min-h-12 items-center gap-2">
            <Switch
              id="large-print"
              checked={prefs.largePrint}
              onCheckedChange={(v) => setPref("largePrint", v)}
            />
            <Label htmlFor="large-print" className="flex items-center gap-1.5 text-base">
              <ZoomIn className="size-5" aria-hidden="true" />
              Large print
            </Label>
          </div>
          <div className="flex min-h-12 items-center gap-2">
            <Switch
              id="high-contrast"
              checked={prefs.highContrast}
              onCheckedChange={(v) => setPref("highContrast", v)}
            />
            <Label htmlFor="high-contrast" className="flex items-center gap-1.5 text-base">
              <Contrast className="size-5" aria-hidden="true" />
              High contrast
            </Label>
          </div>
        </fieldset>
      </div>
    </header>
  );
}
