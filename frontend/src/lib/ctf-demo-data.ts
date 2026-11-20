export type Competition = {
  id: string;
  name: string;
  platform: string;
  dates: string;
  status: "Active" | "Completed" | "Upcoming";
  challengeCount: number;
  completion: number;
  deadline: string;
  rules: "Review required" | "Reviewed" | "Not checked";
};

export type Challenge = {
  id: string;
  name: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  status: "In progress" | "Solved" | "Not started";
  evidence: number;
  competition: string;
  updated: string;
};

export type Evidence = {
  id: string;
  name: string;
  type: "Screenshot" | "Terminal log" | "Source code" | "Network capture" | "Document";
  challenge: string;
  collected: string;
  hash: string;
  verified: boolean;
  description: string;
};

export const initialCompetitions: Competition[] = [];

export const initialChallenges: Challenge[] = [];

export const initialEvidence: Evidence[] = [];

export const activityItems: { icon: string; title: string; detail: string; time: string; tone: string }[] = [];

export const starterWriteup = `# Challenge Writeup

> Category · Difficulty · Points

## 1. Executive Summary & Target Profile

Record the target environment, service details, and primary objective.

## 2. Reconnaissance & Fingerprinting

Record initial port scans, directory fuzzing, and exposed endpoints. Link verified evidence from the Evidence Vault.

## 3. Vulnerability Identification

Detail the underlying root cause (e.g. injection, auth bypass, memory corruption) and affected parameters.

## 4. Exploit Mechanism & Payload

Provide the exploit payload or script used to achieve execution or bypass controls.

## 5. Step-by-Step Execution Transcript

\`\`\`bash
# Record commands executed during reproduction
\`\`\`

## 6. Flag Retrieval & Cryptographic Integrity

- **Flag**: \`CTF{REDACTED_FLAG_TOKEN}\`
- **SHA-256 Proof**: Record hash of captured flag artifact.

## 7. Remediation & Hardening

Describe how the vulnerability can be mitigated or patched.
`;
