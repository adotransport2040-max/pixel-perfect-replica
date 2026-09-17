import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdoApp = lazy(() => import("../AdoApp"));

const title = "ADO Transport — VAT Billing System";
const description =
  "Nepali Bikram Sambat VAT billing and accounting for ADO Transport: purchase & sales registers, IRD return reports, invoices, and party ledgers.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-slate-50" />}>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <AdoApp />
      </Suspense>
    </ClientOnly>
  );
}
