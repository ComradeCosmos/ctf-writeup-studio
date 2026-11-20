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

export const initialCompetitions: Competition[] = [
  { id: "c-1", name: "Northstar CTF 2026", platform: "CTFd", dates: "Oct 24–26, 2026", status: "Active", challengeCount: 18, completion: 67, deadline: "Oct 26, 2026", rules: "Review required" },
  { id: "c-2", name: "Packet Storm Invitational", platform: "Self-hosted", dates: "Oct 10–12, 2026", status: "Completed", challengeCount: 12, completion: 100, deadline: "Oct 12, 2026", rules: "Reviewed" },
  { id: "c-3", name: "Winter Byte Games", platform: "CTFd", dates: "Dec 05–07, 2026", status: "Upcoming", challengeCount: 24, completion: 0, deadline: "Dec 07, 2026", rules: "Not checked" },
];

export const initialChallenges: Challenge[] = [
  { id: "ch-1", name: "Paper Trail", category: "Web", difficulty: "Medium", points: 250, status: "In progress", evidence: 4, competition: "Northstar CTF 2026", updated: "12 min ago" },
  { id: "ch-2", name: "Quiet Current", category: "Forensics", difficulty: "Easy", points: 100, status: "Solved", evidence: 3, competition: "Northstar CTF 2026", updated: "1 hr ago" },
  { id: "ch-3", name: "Glass Cipher", category: "Cryptography", difficulty: "Hard", points: 450, status: "In progress", evidence: 2, competition: "Northstar CTF 2026", updated: "2 hrs ago" },
  { id: "ch-4", name: "Little Echo", category: "Misc", difficulty: "Easy", points: 100, status: "Solved", evidence: 1, competition: "Northstar CTF 2026", updated: "Yesterday" },
  { id: "ch-5", name: "Cold Boot", category: "Reverse engineering", difficulty: "Hard", points: 400, status: "Not started", evidence: 0, competition: "Northstar CTF 2026", updated: "Yesterday" },
  { id: "ch-6", name: "One More Layer", category: "Steganography", difficulty: "Medium", points: 200, status: "In progress", evidence: 2, competition: "Packet Storm Invitational", updated: "Oct 12" },
  { id: "ch-7", name: "Lost Signal", category: "Forensics", difficulty: "Medium", points: 300, status: "Solved", evidence: 5, competition: "Packet Storm Invitational", updated: "Oct 11" },
  { id: "ch-8", name: "Tiny Garden", category: "OSINT", difficulty: "Easy", points: 150, status: "Not started", evidence: 0, competition: "Winter Byte Games", updated: "Oct 09" },
];

export const initialEvidence: Evidence[] = [
  { id: "EV-2048", name: "response-headers.txt", type: "Terminal log", challenge: "Paper Trail", collected: "Oct 24 · 14:32", hash: "a3f9c0d7e1b24a88…", verified: true, description: "Saved HTTP response headers from the challenge environment." },
  { id: "EV-2047", name: "challenge-overview.png", type: "Screenshot", challenge: "Paper Trail", collected: "Oct 24 · 14:28", hash: "d41b8cd98f00b204…", verified: true, description: "Original challenge page captured before analysis." },
  { id: "EV-2046", name: "notes-recon.md", type: "Document", challenge: "Paper Trail", collected: "Oct 24 · 14:21", hash: "9e107d9d372bb682…", verified: true, description: "Research notes and source references." },
  { id: "EV-2045", name: "metadata-summary.txt", type: "Terminal log", challenge: "Quiet Current", collected: "Oct 24 · 13:52", hash: "e4d909c290d0fb1c…", verified: true, description: "Metadata review notes for the supplied practice file." },
  { id: "EV-2044", name: "file-metadata.png", type: "Screenshot", challenge: "Quiet Current", collected: "Oct 24 · 13:47", hash: "0cc175b9c0f1b6a8…", verified: true, description: "Screenshot of file properties in the analysis workspace." },
  { id: "EV-2043", name: "cipher-observations.md", type: "Document", challenge: "Glass Cipher", collected: "Oct 24 · 12:38", hash: "92eb5ffee6ae2fec…", verified: false, description: "Unreviewed observations. Not a confirmed solution." },
  { id: "EV-2042", name: "session-02.log", type: "Terminal log", challenge: "Glass Cipher", collected: "Oct 24 · 12:16", hash: "c3fcd3d76192e400…", verified: true, description: "Sampled command and output transcript from the local demo session." },
  { id: "EV-2041", name: "capture-01.pcap", type: "Network capture", challenge: "Lost Signal", collected: "Oct 12 · 17:04", hash: "aab3238922bcc25a…", verified: true, description: "Competition-provided packet capture, original preserved." },
  { id: "EV-2040", name: "frame-extract.png", type: "Screenshot", challenge: "One More Layer", collected: "Oct 12 · 15:18", hash: "8277e0910d750195…", verified: true, description: "Reference frame from the provided challenge media." },
  { id: "EV-2039", name: "challenge-brief.pdf", type: "Document", challenge: "Little Echo", collected: "Oct 11 · 11:42", hash: "e2c420d928d4bf8c…", verified: true, description: "Competition-provided challenge statement." },
  { id: "EV-2038", name: "source-snippet.txt", type: "Source code", challenge: "Lost Signal", collected: "Oct 11 · 10:16", hash: "4a8a08f09d37b737…", verified: false, description: "Annotated copy for review; original artifact remains unchanged." },
  { id: "EV-2037", name: "timeline-notes.md", type: "Document", challenge: "Paper Trail", collected: "Oct 10 · 09:32", hash: "8277e0910d750195…", verified: true, description: "Initial chronology and evidence references." },
];

export const activityItems = [
  { icon: "file", title: "Evidence added", detail: "response-headers.txt · Paper Trail", time: "12 min ago", tone: "cyan" },
  { icon: "edit", title: "Writeup updated", detail: "Reconnaissance · Paper Trail", time: "34 min ago", tone: "lime" },
  { icon: "circle", title: "Session completed", detail: "Glass Cipher · 14m 20s", time: "1 hr ago", tone: "amber" },
  { icon: "check", title: "Challenge solved", detail: "Quiet Current · 100 pts", time: "2 hrs ago", tone: "lime" },
];

export const starterWriteup = `# Paper Trail\n\n> Northstar CTF 2026 · Web · Medium\n\n## Challenge overview\n\nA short description of the challenge, the supplied files, and the scope of this authorized competition exercise.\n\n## Reconnaissance\n\nRecord the initial observations and link each claim to its source evidence.\n\n\`\`\`text\n$ curl -I https://practice.example.invalid\n\`\`\`\n\n## Analysis\n\nDescribe what the evidence shows. Keep hypotheses separate from verified observations.\n\n## Solution\n\nDocument the verified steps in order, including relevant evidence references.\n\n## Key takeaways\n\n- Preserve original artifacts.\n- Record the context for every observation.\n\n## References\n\n- Competition-provided challenge brief\n`;