import type { KmsDocument, KmsDocumentCreate } from "@/types/kms";

type DocumentsResponse = {
  items: RawKmsDocument[];
  total: number;
  limit: number;
  offset: number;
};

type RawKmsDocument = Partial<KmsDocument> & {
  team_id?: string;
  file_type?: string;
  file_name?: string;
  file_storage_path?: string;
  file_size_bytes?: number | null;
  file_content_type?: string;
  ingestion_status?: string;
  ingestion_job_id?: string;
  ingestion_error?: string;
  ingestion_chunk_count?: number;
  ingested_at?: string | null;
  related_teams?: string[];
  source_link?: string;
};

function normalizeDocument(document: RawKmsDocument): KmsDocument {
  return {
    id: String(document.id || ""),
    title: String(document.title || ""),
    slug: String(document.slug || ""),
    teamId: String(document.teamId || document.team_id || ""),
    team: String(document.team || ""),
    category: String(document.category || ""),
    summary: String(document.summary || ""),
    content: String(document.content || ""),
    fileType: String(document.fileType || document.file_type || "Text Page"),
    fileName: String(document.fileName || document.file_name || "No supporting file attached"),
    fileStoragePath: document.fileStoragePath ?? document.file_storage_path ?? "",
    fileSizeBytes: document.fileSizeBytes ?? document.file_size_bytes ?? null,
    fileContentType: document.fileContentType ?? document.file_content_type ?? "",
    ingestionStatus: document.ingestionStatus || document.ingestion_status || "not_required",
    ingestionJobId: document.ingestionJobId || document.ingestion_job_id || "",
    ingestionError: document.ingestionError || document.ingestion_error || "",
    ingestionChunkCount: document.ingestionChunkCount ?? document.ingestion_chunk_count ?? 0,
    ingestedAt: document.ingestedAt ?? document.ingested_at ?? null,
    tags: document.tags || [],
    relatedTeams: document.relatedTeams || document.related_teams || [],
    sourceLink: document.sourceLink || document.source_link || "",
    updated: String(document.updated || "")
  };
}

async function parseApiError(response: Response) {
  try {
    const payload = await response.json();
    return payload.detail || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchDocuments() {
  const response = await fetch("/api/documents?limit=200", {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as DocumentsResponse;
  return payload.items.map(normalizeDocument);
}

export async function createDocument(document: KmsDocumentCreate, file?: File | null) {
  const formData = new FormData();
  formData.set("title", document.title);
  formData.set("slug", document.slug);
  formData.set("category", document.category);
  formData.set("summary", document.summary);
  formData.set("content", document.content);
  formData.set("file_type", document.fileType);
  formData.set("file_name", document.fileName);
  formData.set("tags", document.tags.join(","));
  formData.set("related_teams", document.relatedTeams.join(","));
  formData.set("source_link", document.sourceLink);
  formData.set("updated", document.updated);
  if (file) {
    formData.set("file", file);
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[KMS attachment:create] request", {
      hasFile: Boolean(file),
      fileName: file?.name || "",
      fileSize: file?.size || 0
    });
  }

  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const rawDocument = (await response.json()) as RawKmsDocument;
  console.debug("[KMS attachment:create] raw response", {
    id: rawDocument.id,
    title: rawDocument.title,
    file_name: rawDocument.file_name,
    file_storage_path: rawDocument.file_storage_path,
    file_content_type: rawDocument.file_content_type,
    file_size_bytes: rawDocument.file_size_bytes,
    fileName: rawDocument.fileName,
    fileStoragePath: rawDocument.fileStoragePath,
    fileContentType: rawDocument.fileContentType,
    fileSizeBytes: rawDocument.fileSizeBytes
  });
  const savedDocument = normalizeDocument(rawDocument);
  if (process.env.NODE_ENV !== "production") {
    console.debug("[KMS attachment:create] response", {
      id: savedDocument.id,
      fileName: savedDocument.fileName,
      fileStoragePath: savedDocument.fileStoragePath,
      fileContentType: savedDocument.fileContentType,
      fileSizeBytes: savedDocument.fileSizeBytes,
      ingestionStatus: savedDocument.ingestionStatus
    });
  }

  return savedDocument;
}

export async function updateDocument(documentId: string, updates: Partial<KmsDocumentCreate>) {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return normalizeDocument((await response.json()) as RawKmsDocument);
}

export async function uploadDocumentFile(documentId: string, file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`/api/documents/${documentId}/file`, {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return normalizeDocument((await response.json()) as RawKmsDocument);
}
