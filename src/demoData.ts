import type { ClientForm } from "./types";

export const demoClients: ClientForm[] = [
  {
    name: "Sarah Mitchell",
    company: "Acme Consulting",
    email: "sarah@acme.test",
    phone: "+1 415 555 0184",
    status: "Proposal",
    value: "12500",
    note: "Requested a proposal for a lightweight client onboarding dashboard.",
  },
  {
    name: "Daniel Brooks",
    company: "Northstar Studio",
    email: "daniel@northstar.test",
    phone: "+44 20 7946 0148",
    status: "Contacted",
    value: "8400",
    note: "Follow up after the discovery call about internal workflow tracking.",
  },
  {
    name: "Emma Carter",
    company: "Bright Dental",
    email: "emma@brightdental.test",
    phone: "+61 2 5550 0192",
    status: "Won",
    value: "16750",
    note: "Approved the first phase for a sales pipeline and activity tracker.",
  },
];
