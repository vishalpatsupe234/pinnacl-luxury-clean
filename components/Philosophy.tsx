export default function Philosophy() {
  const principles = [
    {
      title: "Discretion",
      body: "Every introduction is private. We work quietly, off-market, and only with those who value the same.",
    },
    {
      title: "Curation",
      body: "We decline more than we present. What remains is a short list of genuinely rare residences.",
    },
    {
      title: "Permanence",
      body: "We advise on homes that hold meaning — and value — for generations, not market cycles.",
    },
  ];

  return (
    <section id="about" className="border-y border-border bg-surface-2">
      <div className="container-lux py-24 md:py-32">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <span className="eyebrow mb-5 block">Our Philosophy</span>
            <h2 className="text-balance text-3xl leading-[1.15] text-foreground md:text-4xl lg:text-5xl">
              Quiet luxury is not a style. It is a way of choosing.
            </h2>
            <p className="mt-7 max-w-md text-pretty leading-relaxed text-foreground/65">
              Pinnacl Estate exists for buyers who already know what they want and
              simply require the right counsel to find it. No noise, no spectacle —
              only considered guidance toward homes worthy of a lifetime.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {principles.map((p, i) => (
              <div key={p.title} className="flex gap-8 py-7 first:pt-0 last:pb-0">
                <span className="font-serif text-sm text-gold">0{i + 1}</span>
                <div>
                  <h3 className="font-serif text-xl text-foreground">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-foreground/60">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
