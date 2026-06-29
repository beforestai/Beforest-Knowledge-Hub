export type ViewId =
  | "home"
  | "teams"
  | "documents"
  | "recent"
  | "shared"
  | "collective"
  | "glossary"
  | "templates";

export type QuickFilter = {
  type: "all" | "team" | "category";
  value: string;
};

export type KmsDocument = {
  id: string;
  title: string;
  slug: string;
  teamId: string;
  team: string;
  category: string;
  summary: string;
  content: string;
  fileType: string;
  fileName: string;
  fileStoragePath?: string;
  fileSizeBytes?: number | null;
  fileContentType?: string;
  ingestionStatus?: string;
  ingestionJobId?: string;
  ingestionError?: string;
  ingestionChunkCount?: number;
  ingestedAt?: string | null;
  tags: string[];
  relatedTeams: string[];
  sourceLink: string;
  updated: string;
};

export type KmsDocumentCreate = Omit<KmsDocument, "id">;

export type Team = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  teamId: string;
  team: string;
};

export type ReferenceGroup = {
  label: string;
  color: "green" | "amber" | "purple" | "coral" | "blue";
  links: Array<{
    name: string;
    url: string;
  }>;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  citations?: ChatCitation[];
  loading?: boolean;
};

export type ChatCitation = KmsDocument & {
  citationLink: string;
  chunkId: string;
  chunkIndex: number;
  chunkText: string;
  distance: number;
};
