import { useState } from 'react';
import PasscodeGate from './components/PasscodeGate';
import Layout from './components/Layout';
import AncientManuscripts from './components/AncientManuscripts';
import FamilyHistory from './components/FamilyHistory';
import PeopleDirectory from './components/PeopleDirectory';
import ClanInteraction from './components/ClanInteraction';
import FamilyActivities from './components/FamilyActivities';
import ContactClan from './components/ContactClan';
import { Separator } from '@/components/ui/separator';

export type Section = 'manuscripts' | 'history' | 'people' | 'interaction' | 'contact';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('genealogy_authenticated') === 'true';
  });
  const [activeSection, setActiveSection] = useState<Section>('manuscripts');

  if (!authenticated) {
    return (
      <PasscodeGate
        onAuthenticated={() => {
          sessionStorage.setItem('genealogy_authenticated', 'true');
          setAuthenticated(true);
        }}
      />
    );
  }

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === 'manuscripts' && <AncientManuscripts />}
      {activeSection === 'history' && <FamilyHistory />}
      {activeSection === 'people' && <PeopleDirectory />}
      {activeSection === 'interaction' && (
        <div className="space-y-10">
          {/* Message Board sub-section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-seal-600 rounded-full" />
              <h2 className="font-serif text-2xl font-bold text-ink-900 tracking-[0.15em]">
                族人互动
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/60 to-transparent" />
            </div>
            <ClanInteraction />
          </div>

          <Separator className="border-parchment-300" />

          {/* Family Activities sub-section */}
          <div>
            <FamilyActivities />
          </div>
        </div>
      )}
      {activeSection === 'contact' && <ContactClan />}
    </Layout>
  );
}
