import { AboutContent } from "@/components/about/about-content";
import { PageShell } from "@/components/layout/page-shell";

export default function AboutPage() {
  return (
    <PageShell
      title="About DECA"
      description="Distributive Education Clubs of America prepares emerging leaders and entrepreneurs for careers in marketing, finance, hospitality, and management."
      icon="book"
    >
      <AboutContent />
    </PageShell>
  );
}
