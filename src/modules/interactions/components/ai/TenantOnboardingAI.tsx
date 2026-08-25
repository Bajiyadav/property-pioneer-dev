import React, { useState } from "react";
import { SeedhaAIAssistant } from "./SeedhaAIAssistant";
import { PropertyMatchResults } from "./PropertyMatchResults";
import type { ExtractedTenantPreferences } from "@/modules/interactions/services/geminiService";

export const TenantOnboardingAI: React.FC = () => {
  const [preferences, setPreferences] = useState<ExtractedTenantPreferences | null>(null);

  if (preferences) {
    return <PropertyMatchResults preferences={preferences} onReset={() => setPreferences(null)} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto h-[600px] border border-teal-100 rounded-3xl overflow-hidden shadow-xl bg-white relative">
      <div className="absolute inset-0 flex flex-col">
        <SeedhaAIAssistant
          mode="tenant"
          inline={true}
          onProfileComplete={(prefs) => setPreferences(prefs)}
        />
      </div>
    </div>
  );
};
