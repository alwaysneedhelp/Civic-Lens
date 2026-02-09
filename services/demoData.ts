import { AuditResult } from '../types';

export const DEMO_AUDIT_RESULTS: AuditResult[] = [
  {
    timestamp: "00:05",
    speaker_claim: "We have fully allocated $500,000 to the Community Park renovation project this quarter.",
    normalized_claim: {
      project: "Community Park",
      amount: 500000,
      currency: "USD",
      status: "allocated"
    },
    document_evidence: {
      page: 3,
      text: "Budget Item 4.2: Community Park Renovation. Allocated: $50,000 for Q1 planning phase."
    },
    verdict: "FALSE",
    confidence: 0.98,
    reasoning: "The speaker claims $500,000 was allocated, but the official budget document clearly states only $50,000 was allocated for this period."
  },
  {
    timestamp: "00:22",
    speaker_claim: "The downtown bike lane extension was completed last month.",
    normalized_claim: {
      project: "Downtown Bike Lane",
      status: "completed",
      date: "last month"
    },
    document_evidence: {
      page: 1,
      text: "Infrastructure Update: Downtown Bike Lane extension is currently 80% complete. Expected completion: Next Month."
    },
    verdict: "FALSE",
    confidence: 0.95,
    reasoning: "The speaker claims completion, whereas the status report lists the project as 80% complete with a future expected completion date."
  },
  {
    timestamp: "00:45",
    speaker_claim: "We are moving forward with the solar panel installation on the library roof.",
    normalized_claim: {
      project: "Library Solar Panels",
      status: "in_progress"
    },
    document_evidence: {
      page: 5,
      text: "Approved Projects: Main Library Solar Installation. Status: Contractor selected, work to commence pending weather."
    },
    verdict: "TRUE",
    confidence: 0.92,
    reasoning: "The claim of moving forward aligns with the document's status of 'Approved' and 'Contractor selected'."
  },
  {
    timestamp: "01:10",
    speaker_claim: "The timeline for the new school wing is roughly on track.",
    normalized_claim: {
      project: "New School Wing",
      status: "on_track"
    },
    document_evidence: {
      page: 2,
      text: "School Wing Annex: Construction delays due to supply chain. Revised timeline TBD."
    },
    verdict: "PARTIAL",
    confidence: 0.85,
    reasoning: "The speaker claims it is 'roughly on track', but the document notes 'delays' and a 'Revised timeline TBD', suggesting a discrepancy that isn't a direct falsehood but certainly not fully accurate."
  },
  {
    timestamp: "01:30",
    speaker_claim: "We expect the state grant to cover the remaining costs.",
    normalized_claim: {
      source: "State Grant",
      coverage: "remaining costs"
    },
    document_evidence: {
      page: 4,
      text: "Funding Sources: Federal Grant (Confirmed), State Grant (Application Pending)."
    },
    verdict: "AMBIGUOUS",
    confidence: 0.60,
    reasoning: "The speaker states an expectation, and the document confirms an application is pending. It is not possible to verify if it will cover costs until the grant is awarded."
  }
];