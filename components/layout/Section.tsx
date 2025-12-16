import type { ReactNode } from "react";
import Container from "./Container";

type Props = {
  children: ReactNode;
  className?: string;
  background?: string;
};

export default function Section({
  children,
  className = "",
  background = "",
}: Props) {
  return (
    <section className={`${background} py-16 md:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
