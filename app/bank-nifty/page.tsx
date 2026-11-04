import { Metadata } from 'next';
import { BankNiftyAnalysisRadar } from '@/components/BankNiftyAnalysisRadar';

export const metadata: Metadata = {
  title: 'BANK NIFTY Microstructure Radar | Real-Time Quantitative Cockpit',
  description: 'Institutional microstructure radar tracking all 14 Bank Nifty constituents, Private vs PSU bank dynamics, and order flow.'
};

export default function BankNiftyPage() {
  return (
    <main className="min-h-screen w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <BankNiftyAnalysisRadar />
    </main>
  );
}
