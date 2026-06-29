import type { CurrentUser, KmsDocument, ReferenceGroup, Team } from "@/types/kms";

export const teams: Team[] = [
  { id: "business-intelligence", name: "Business Intelligence", slug: "business-intelligence", description: "Dashboards, reports, metrics definitions" },
  { id: "be-wild", name: "Be Wild", slug: "be-wild", description: "Product pages, field notes, Be Wild experiences, and hospitality-adjacent learning content" },
  { id: "collective-design-and-support", name: "Collective Design & Support", slug: "collective-design-and-support", description: "Collective design and process references" },
  { id: "community-engagement", name: "Community Engagement", slug: "community-engagement", description: "Member communication, events, community notes" },
  { id: "admin", name: "Admin", slug: "admin", description: "Internal admin references and forms" },
  { id: "hr", name: "HR", slug: "hr", description: "Policies, onboarding, people processes" },
  { id: "finance", name: "Finance", slug: "finance", description: "Finance policies, reimbursement, reporting workflows" },
  { id: "collective-operations", name: "Collective Operations", slug: "collective-operations", description: "Operational playbooks and collective workflows" },
  { id: "hospitality", name: "Hospitality", slug: "hospitality", description: "Stays & hospitality pages, guest journeys, and SOPs" },
  { id: "regolith", name: "Regolith", slug: "regolith", description: "Landscape, ecology, and technical knowledge" },
  { id: "marketing", name: "Marketing", slug: "marketing", description: "Brand, content, campaigns, reusable copy" },
  { id: "content-and-storytelling", name: "Content & Storytelling", slug: "content-and-storytelling", description: "Narratives, stories, editorial content, and knowledge pages" },
  { id: "legal-and-liaisoning", name: "Legal & Liaisoning", slug: "legal-and-liaisoning", description: "Legal references, compliance documents, liaisoning" }
];

export const currentUser: CurrentUser = {
  id: "demo-user",
  name: "Demo User",
  email: "demo.user@beforest.local",
  initials: "DM",
  teamId: "marketing",
  team: "Marketing"
};

export function teamIdFromName(name: string) {
  return teams.find((team) => team.name === name)?.id || name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const seedDocuments: KmsDocument[] = [
  {
    id: "doc-001",
    title: "Monthly Collective Metrics Guide",
    slug: "monthly-collective-metrics-guide",
    teamId: "business-intelligence",
    team: "Business Intelligence",
    category: "Reports",
    summary: "Explains common BI metrics used by other teams when reading collective reports.",
    content: "Overview of monthly collective metrics, how teams should read them, and where to use each metric.",
    fileType: "Text Page",
    fileName: "monthly-collective-metrics-guide",
    tags: ["metrics", "collectives", "reports"],
    relatedTeams: ["CDS", "Operations", "Marketing"],
    sourceLink: "https://example.com/metrics",
    updated: "2026-06-05"
  },
  {
    id: "doc-002",
    title: "Collective Onboarding Reference",
    slug: "collective-onboarding-reference",
    teamId: "collective-design-and-support",
    team: "Collective Design & Support",
    category: "Collective-wise Information",
    summary: "Shared collective reference explaining how a new collective moves from design to support.",
    content: "Reference page for collective stages, handoffs, operational context, and responsibilities during collective onboarding.",
    fileType: "PDF",
    fileName: "collective-onboarding-reference.pdf",
    tags: ["onboarding", "collective design", "support"],
    relatedTeams: ["Community Engagement", "Operations"],
    sourceLink: "",
    updated: "2026-06-03"
  },
  {
    id: "doc-003",
    title: "Guest Stay Information Pack",
    slug: "guest-stay-information-pack",
    teamId: "hospitality",
    team: "Hospitality",
    category: "SOP",
    summary: "Hospitality details that Marketing and Operations can refer to when answering stay-related questions.",
    content: "Guest stay information covering arrival, stay experience, common questions, and team handoffs.",
    fileType: "PDF",
    fileName: "guest-stay-information-pack.pdf",
    tags: ["guest", "stay", "hospitality"],
    relatedTeams: ["Marketing", "Collective Operations"],
    sourceLink: "",
    updated: "2026-05-18"
  },
  {
    id: "doc-004",
    title: "Land Documentation Checklist",
    slug: "land-documentation-checklist",
    teamId: "legal-and-liaisoning",
    team: "Legal & Liaisoning",
    category: "Checklist",
    summary: "Internal reference for documents required during land and liaisoning workflows.",
    content: "Checklist-style page for land documentation steps, dependencies, and internal references.",
    fileType: "Spreadsheet",
    fileName: "land-documentation-checklist.xlsx",
    tags: ["legal", "land", "checklist"],
    relatedTeams: ["Admin", "Collective Operations"],
    sourceLink: "",
    updated: "2026-04-22"
  },
  {
    id: "doc-005",
    title: "Beforest Tone And Reusable Copy",
    slug: "beforest-tone-and-reusable-copy",
    teamId: "marketing",
    team: "Marketing",
    category: "Brand Content",
    summary: "Reusable public-facing copy snippets for website pages, FAQs, newsletters, and campaign material.",
    content: "Reusable language for Beforest tone, common explanations, and public-facing content snippets.",
    fileType: "Text Page",
    fileName: "beforest-tone-and-reusable-copy",
    tags: ["brand", "copy", "website"],
    relatedTeams: ["Hospitality", "Be Wild", "Community Engagement"],
    sourceLink: "",
    updated: "2026-06-10"
  },
  {
    id: "doc-006",
    title: "Reimbursement Process",
    slug: "reimbursement-process",
    teamId: "finance",
    team: "Finance",
    category: "Policy",
    summary: "Steps, required fields, and timelines for team reimbursement requests.",
    content: "Finance process page describing reimbursement steps, required proofs, timelines, and support points.",
    fileType: "Document",
    fileName: "reimbursement-process.docx",
    tags: ["finance", "reimbursement", "policy"],
    relatedTeams: ["All teams"],
    sourceLink: "",
    updated: "2026-05-28"
  }
];

export const collectiveReferenceGroups: ReferenceGroup[] = [
  { label: "Reference", color: "green", links: [{ name: "Beforest main site", url: "https://beforest.co/" }] },
  {
    label: "Collective Webpages",
    color: "green",
    links: [
      { name: "What is a Collective?", url: "https://beforest.co/farming-collectives/" },
      { name: "Poomaale 1.0", url: "https://beforest.co/the-poomaale-estate/" },
      { name: "Poomaale 2.0", url: "https://beforest.co/poomaale-2-0-collective/" },
      { name: "Hyderabad Collective", url: "https://beforest.co/hyderabad-collective/" },
      { name: "Hammiyala Collective", url: "https://beforest.co/co-forest/" },
      { name: "Bhopal Collective", url: "https://beforest.co/the-bhopal-collective/" },
      { name: "Mumbai Collective", url: "https://beforest.co/the-mumbai-collective/" }
    ]
  },
  {
    label: "Experiences",
    color: "amber",
    links: [
      { name: "Beforest Experiences", url: "https://experiences.beforest.co/" },
      { name: "All Experiences", url: "https://experiences.beforest.co/experiences" }
    ]
  },
  { label: "10 percent lifestyle", color: "amber", links: [{ name: "10percent", url: "https://10percent.beforest.co/" }] },
  { label: "Hospitality", color: "purple", links: [{ name: "Blyton Bungalow", url: "https://hospitality.beforest.co/" }] },
  {
    label: "Bewild",
    color: "coral",
    links: [
      { name: "Bewild main site", url: "https://bewild.life/" },
      { name: "Collections Page", url: "https://bewild.life/collections" },
      { name: "Collections ALL", url: "https://bewild.life/collections/all" }
    ]
  },
  {
    label: "Beforest",
    color: "blue",
    links: [
      { name: "About us", url: "https://beforest.co/about-us/" },
      { name: "Blog", url: "https://beforest.co/blogs/" },
      { name: "FAQ", url: "https://beforest.co/faq/" }
    ]
  }
];

export const storageKey = "beforest-kms-demo-documents";
export const overviewStorageKey = "beforest-kms-collective-overviews";
