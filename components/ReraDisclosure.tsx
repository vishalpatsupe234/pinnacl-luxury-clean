import {
  AGENT_RERA_NUMBER,
  MAHARERA_WEBSITE,
  describeProjectRegistration,
} from "@/lib/compliance/rera";

// Renders only facts the database actually supports:
//   - Pinnacl's agent registration number, when configured
//   - the project registration number recorded against this property
//   - the Authority's website address, so a buyer can check both themselves
//
// It makes no verification claim. Per MahaRERA Order 46C/2025 the agent
// registration number and the project registration number must both be
// quoted in an agent's advertisement; this component is where that happens
// for a listing page. Placement/font/QR rules from that order are NOT
// implemented — see the TODOs in lib/compliance/rera.ts. Nothing here should
// be read as a statement that the order is satisfied.
//
// When neither number is available the component renders nothing rather than
// substituting softer wording.

export default function ReraDisclosure({
  projectReraNumber,
  variant = "listing",
}: {
  projectReraNumber?: string | null;
  variant?: "listing" | "site";
}) {
  const projectLine = describeProjectRegistration(projectReraNumber);
  const agentLine = AGENT_RERA_NUMBER
    ? `Pinnacl Properties — MahaRERA registered real estate agent: ${AGENT_RERA_NUMBER}`
    : null;

  if (!projectLine && !agentLine) return null;

  if (variant === "site") {
    return (
      <span className="text-xs font-light text-white/30">
        {agentLine ?? null}
      </span>
    );
  }

  return (
    <section
      aria-label="MahaRERA registration details"
      className="mt-10 border-t border-[var(--color-brand-border)] pt-6 text-[11px] font-light leading-relaxed text-[var(--color-brand-muted)]"
    >
      {agentLine && <p>{agentLine}</p>}
      {projectLine && <p>{projectLine}</p>}
      <p>
        Verify registration details on the MahaRERA portal:{" "}
        <a
          href={MAHARERA_WEBSITE}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-[var(--color-brand-black)]"
        >
          {MAHARERA_WEBSITE}
        </a>
      </p>
      <p>
        Registration numbers shown are as recorded by Pinnacl Properties and
        are published so they can be independently checked. Buyers should
        verify all project details, approvals and documents directly with the
        promoter and on the MahaRERA portal before making any commitment.
      </p>
    </section>
  );
}
