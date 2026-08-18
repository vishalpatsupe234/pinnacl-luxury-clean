import { Suspense } from "react";
import Link from "next/link";
import AcceptInviteForm from "./AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <Link href="/" className="inline-block">
            <span className="font-serif text-2xl tracking-[0.12em] text-brand-black">
              Pinnacl
            </span>
            <span className="block text-[10px] tracking-[0.35em] uppercase text-brand-muted mt-1">
              Properties
            </span>
          </Link>
        </div>

        <div className="mt-10">
          <Suspense
            fallback={
              <p className="text-sm font-light text-brand-muted text-center">Loading…</p>
            }
          >
            <AcceptInviteForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
