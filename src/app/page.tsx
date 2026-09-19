import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  Eye,
  Printer,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: CreditCard,
    title: "Wallet card and full page",
    text: "Print a credit-card-size ID, a fold-over card, or a full A4 or US Letter page.",
  },
  {
    icon: CalendarClock,
    title: "Medication Cadence",
    text: "A daily schedule showing each pill, when to take it, and whether to eat first.",
  },
  {
    icon: Eye,
    title: "Built for tired eyes",
    text: "Large print, high contrast, big buttons and plain words. Works with screen readers.",
  },
  {
    icon: Printer,
    title: "Print or download a PDF",
    text: "Download a ready-to-share PDF directly, or use your browser's print dialog.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Your medical details, clear enough to read in an emergency.
          </h1>
          <p className="text-xl text-muted-foreground">
            Cadence helps you make a Medical ID card and a simple medication
            schedule you can print and keep in your wallet, on the fridge, or by
            the bed.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} render={<Link href="/my-id" />} size="lg" className="min-h-14 text-lg">
              <UserRound aria-hidden="true" /> Create my Medical ID
            </Button>
            <Button nativeButton={false} render={<Link href="/doctor" />} size="lg" variant="outline" className="min-h-14 text-lg">
              <Stethoscope aria-hidden="true" /> I am a doctor or carer
            </Button>
          </div>
          <p className="text-muted-foreground">
            Everything you type stays in this browser. There is no account and no
            upload.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto w-full max-w-sm rounded-xl border-2 border-primary/40 bg-card p-5 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between border-b-2 border-primary pb-2">
            <span className="font-bold text-primary">MEDICAL ID</span>
            <span className="rounded bg-destructive px-2 py-0.5 text-sm font-bold text-white">
              O−
            </span>
          </div>
          <p className="text-2xl font-bold">Margaret Okafor</p>
          <p className="text-muted-foreground">Born 14 Mar 1951</p>
          <dl className="mt-3 space-y-1">
            <div>
              <dt className="inline font-bold">Allergies: </dt>
              <dd className="inline">Penicillin, Latex</dd>
            </div>
            <div>
              <dt className="inline font-bold">Conditions: </dt>
              <dd className="inline">Type 2 diabetes, Atrial fibrillation</dd>
            </div>
            <div>
              <dt className="inline font-bold">Emergency: </dt>
              <dd className="inline">David (son) 07700 900 123</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="features" className="mt-16">
        <h2 id="features" className="mb-6 text-2xl font-bold">
          What you can make
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="size-8 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-base">{text}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
