import { Hero } from '@/components/landing/hero';
import { SocialProof } from '@/components/landing/social-proof';
import { BentoFeatures } from '@/components/landing/bento-features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { CtaSection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Hero />
      <SocialProof />
      <BentoFeatures />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  );
}
