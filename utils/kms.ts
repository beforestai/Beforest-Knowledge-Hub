import type { KmsDocument } from "@/types/kms";

export function normalize(value: unknown) {
  return String(value || "").toLowerCase();
}

export function stripHtml(value: string) {
  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, "");
  }
  const container = document.createElement("div");
  container.innerHTML = value || "";
  return container.textContent || container.innerText || "";
}

export function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function pagePathForDoc(doc: KmsDocument) {
  return `/kms/${slugify(doc.team)}/${doc.slug || doc.id}`;
}

export function tokenizeQuery(value: string) {
  const stopWords = new Set([
    "about",
    "after",
    "also",
    "and",
    "any",
    "are",
    "can",
    "does",
    "for",
    "from",
    "how",
    "into",
    "kms",
    "our",
    "page",
    "please",
    "show",
    "tell",
    "that",
    "the",
    "this",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "work",
    "works"
  ]);

  const tokens = normalize(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));

  return [
    ...new Set(
      tokens.flatMap((token) => {
        const variants = [token];
        if (token.endsWith("s") && token.length > 4) {
          variants.push(token.slice(0, -1));
        }
        if (token.endsWith("ies") && token.length > 5) {
          variants.push(`${token.slice(0, -3)}y`);
        }
        return variants;
      })
    )
  ];
}

export function searchableDocText(doc: KmsDocument) {
  return [
    doc.title,
    doc.team,
    doc.category,
    doc.summary,
    stripHtml(doc.content),
    doc.fileType,
    doc.fileName,
    doc.tags.join(" "),
    doc.relatedTeams.join(" ")
  ].join(" ");
}

export function findRelevantDocuments(question: string, documents: KmsDocument[]) {
  const query = normalize(question);
  const tokens = tokenizeQuery(question);
  if (!tokens.length) return [];

  return documents
    .map((doc) => {
      const title = normalize(doc.title);
      const summary = normalize(doc.summary);
      const tags = normalize(doc.tags.join(" "));
      const text = normalize(searchableDocText(doc));
      let score = 0;

      if (title.includes(query)) score += 8;
      if (summary.includes(query)) score += 5;
      if (text.includes(query)) score += 3;

      tokens.forEach((token) => {
        if (title.includes(token)) score += 4;
        if (tags.includes(token)) score += 3;
        if (summary.includes(token)) score += 2;
        if (text.includes(token)) score += 1;
      });

      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.doc.updated.localeCompare(a.doc.updated))
    .slice(0, 4)
    .map((item) => item.doc);
}

export function buildLocalChatAnswer(question: string, docs: KmsDocument[]) {
  if (!docs.length) {
    return "I could not find a matching KMS page for this question. Add a page with the source content, summary, keywords, and source link, then ask again.";
  }

  const primary = docs[0];
  const supporting = docs.slice(1);
  const summary = stripHtml(primary.content) || primary.summary;
  const supportLine = supporting.length
    ? `\n\nRelated sources to review: ${supporting.map((doc) => doc.title).join(", ")}.`
    : "";

  return `Based on the strongest matching KMS page, "${primary.title}" covers this topic for ${primary.team}. ${primary.summary} ${summary ? `Key available detail: ${summary}` : ""}${supportLine}\n\nUse the citations below to open the source page(s).`;
}

export function formatDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function pageToneClass(team: string) {
  const slug = slugify(team);
  const map: Record<string, string> = {
    "business-intelligence": "tone-bi",
    "be-wild": "tone-bewild",
    hospitality: "tone-hospitality",
    finance: "tone-finance",
    marketing: "tone-marketing"
  };
  return map[slug] || "tone-default";
}

export function initialsFromTeam(team: string) {
  return String(team || "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function fileTypeFromName(name: string) {
  const extension = (name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    md: "Text Page",
    pdf: "PDF",
    doc: "Document",
    docx: "Document",
    xls: "Spreadsheet",
    xlsx: "Spreadsheet",
    csv: "Spreadsheet",
    ppt: "Deck",
    pptx: "Deck",
    png: "Image",
    jpg: "Image",
    jpeg: "Image"
  };
  return map[extension] || "File";
}

export function citationLabel(doc: KmsDocument) {
  return `${doc.title} - ${doc.team}`;
}
