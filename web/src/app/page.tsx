import { Hero } from '@/components/Hero';
import { Scanner } from '@/components/Scanner';
import { HowItWorks } from '@/components/HowItWorks';
import { Pricing } from '@/components/Pricing';
import { CTA } from '@/components/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Scanner />
      <HowItWorks />
      <Pricing />
      <CTA />
    </>
  );
}