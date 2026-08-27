/**
 * Seedha Properties — Curated Standard Legal Tenancy Clauses
 */

import { type ClauseSelection } from "../types";

export interface ClauseDefinition {
  id: keyof ClauseSelection;
  title: string;
  category: "commercial" | "occupancy" | "maintenance" | "termination";
  summary: string;
  templateText: (terms: {
    monthlyRent: number;
    securityDeposit: number;
    noticePeriodMonths: number;
    lockInPeriodMonths: number;
    rentEscalationPercent: number;
    rentEscalationPeriodMonths: number;
    paymentDueDay: number;
    maintenanceResponsibility: string;
    utilityResponsibility: string;
  }) => string;
  recommended: boolean;
}

export const DEFAULT_CLAUSE_SELECTION: ClauseSelection = {
  noticePeriod: true,
  securityDepositRefund: true,
  lockInPeriod: true,
  utilityPayments: true,
  maintenanceCharges: true,
  rentEscalation: true,
  peacefulEnjoyment: true,
  noSubletting: true,
  propertyUsage: true,
  petPolicy: true,
  paintingAndRepairs: true,
  entryInspectionNotice: true,
  forceMajeure: true,
};

export const STANDARD_CLAUSES: ClauseDefinition[] = [
  {
    id: "noticePeriod",
    title: "Notice Period & Early Termination",
    category: "termination",
    summary:
      "Mandates written notice by either party prior to vacating or terminating the agreement.",
    recommended: true,
    templateText: (terms) =>
      `Either party may terminate this agreement prior to expiry by serving a clear written notice of at least ${terms.noticePeriodMonths} month(s) in advance or by paying rent in lieu thereof, subject to completion of the lock-in period.`,
  },
  {
    id: "securityDepositRefund",
    title: "Security Deposit & Refund Terms",
    category: "commercial",
    summary:
      "Specifies interest-free deposit refund conditions and permissible utility/damage deductions.",
    recommended: true,
    templateText: (terms) =>
      `The Landlord acknowledges receipt of an interest-free refundable security deposit of ₹${terms.securityDeposit.toLocaleString("en-IN")}. The deposit shall be refunded to the Tenant within 7 days of handing over vacant possession of the premises, after adjusting unpaid utility dues or verified damages beyond reasonable wear and tear.`,
  },
  {
    id: "lockInPeriod",
    title: "Lock-in Period Commitment",
    category: "termination",
    summary:
      "Guarantees tenancy stability where neither party can terminate without mutual compensation.",
    recommended: true,
    templateText: (terms) =>
      terms.lockInPeriodMonths > 0
        ? `Both parties agree to a mandatory lock-in period of ${terms.lockInPeriodMonths} month(s) from the commencement date. If either party terminates during this period, the initiating party shall be liable for rent for the remainder of the lock-in period.`
        : `No mandatory lock-in period is enforced; standard notice period rules apply from tenancy commencement.`,
  },
  {
    id: "utilityPayments",
    title: "Electricity, Water & Utility Charges",
    category: "commercial",
    summary:
      "Designates responsibility for monthly metered electricity, water, internet, and gas bills.",
    recommended: true,
    templateText: (terms) =>
      `The ${terms.utilityResponsibility === "tenant" ? "Tenant" : "Landlord"} agrees to bear and regularly pay all actual metered consumption charges including electricity, water, piped gas, and high-speed internet as per official bills received from local authorities during the term.`,
  },
  {
    id: "maintenanceCharges",
    title: "Society Maintenance & Association Dues",
    category: "commercial",
    summary:
      "Clarifies whether residential society/RWA monthly maintenance is borne by Landlord or Tenant.",
    recommended: true,
    templateText: (terms) =>
      `Monthly gated society / building maintenance charges shall be borne and disbursed directly by the ${terms.maintenanceResponsibility === "tenant" ? "Tenant" : "Landlord"} on or before the due date specified by the Resident Welfare Association (RWA).`,
  },
  {
    id: "rentEscalation",
    title: "Rent Escalation on Renewal",
    category: "commercial",
    summary:
      "Defines the agreed percentage increment if the agreement is renewed after term completion.",
    recommended: true,
    templateText: (terms) =>
      terms.rentEscalationPercent > 0
        ? `Upon mutual agreement to extend or renew this tenancy beyond ${terms.rentEscalationPeriodMonths} months, the monthly rent shall increase by an agreed escalation rate of ${terms.rentEscalationPercent}% over the preceding base rent.`
        : `Any future rent revision upon renewal shall be subject to fresh mutual negotiation between both parties.`,
  },
  {
    id: "noSubletting",
    title: "Prohibition on Subletting & Commercial Assignment",
    category: "occupancy",
    summary:
      "Prevents the tenant from assigning, subleasing, or transferring possession to third parties.",
    recommended: true,
    templateText: () =>
      `The Tenant shall not assign, sublet, transfer, or part with the possession of the premises or any part thereof to any third party without obtaining prior written consent from the Landlord.`,
  },
  {
    id: "propertyUsage",
    title: "Permitted Use & Lawful Conduct",
    category: "occupancy",
    summary:
      "Ensures the property is used strictly for legitimate residential/commercial purposes without nuisance.",
    recommended: true,
    templateText: () =>
      `The premises shall be used strictly for lawful purposes as specified in this agreement and the Tenant shall not conduct any illegal, hazardous, or nuisance-causing activities within the premises.`,
  },
  {
    id: "paintingAndRepairs",
    title: "Repairs, Maintenance & Painting Covenants",
    category: "maintenance",
    summary:
      "Allocates day-to-day minor fixes to tenant while structural repairs remain with landlord.",
    recommended: true,
    templateText: () =>
      `The Landlord shall attend to structural defects, major seepage, and external pipeline repairs. The Tenant shall be responsible for routine day-to-day minor repairs (fuses, tap washers, bulb replacements) and shall return the premises in good clean condition.`,
  },
  {
    id: "entryInspectionNotice",
    title: "Landlord Inspection Notice",
    category: "occupancy",
    summary:
      "Requires reasonable advance notice before the landlord or authorized agent inspects the property.",
    recommended: true,
    templateText: () =>
      `The Landlord or their authorized agent shall have the right to inspect the premises with a minimum of 24 hours prior notice to the Tenant, at reasonable daylight hours without causing undue disturbance.`,
  },
  {
    id: "peacefulEnjoyment",
    title: "Peaceful & Quiet Possession",
    category: "occupancy",
    summary:
      "Assures the tenant peaceful enjoyment of the premises without unlawful disturbance by the landlord.",
    recommended: true,
    templateText: () =>
      `So long as the Tenant pays the rent and complies with covenants herein, the Tenant shall peacefully hold and enjoy the premises during the tenancy without unlawful interruption or eviction.`,
  },
  {
    id: "petPolicy",
    title: "Pet & Domestic Animal Guidelines",
    category: "occupancy",
    summary:
      "Defines pet ownership permissions subject to building society guidelines and cleanliness.",
    recommended: false,
    templateText: () =>
      `Domestic pets are permitted subject to full compliance with Resident Welfare Association (RWA) bylaws, ensuring cleanliness and zero noise nuisance to neighbors. Any property damage caused by pets shall be restored at the Tenant's cost.`,
  },
  {
    id: "forceMajeure",
    title: "Force Majeure & Uninhabitable Premises",
    category: "termination",
    summary:
      "Protects both parties if natural disaster or calamity renders the premises uninhabitable.",
    recommended: true,
    templateText: () =>
      `If the premises are rendered substantially destroyed or uninhabitable by fire, earthquake, flood, or force majeure events beyond human control, rent shall abate until restored or either party may terminate immediately with full deposit refund.`,
  },
];
