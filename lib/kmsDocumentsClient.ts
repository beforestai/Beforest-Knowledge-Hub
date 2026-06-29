import type { KmsDocument, KmsDocumentCreate } from "@/types/kms";

type DocumentsResponse = {
  items: KmsDocument[];
  total: number;
  limit: number;
  offset: number;
};

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
  return payload.items;
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

  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as KmsDocument;
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

  return (await response.json()) as KmsDocument;
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

  return (await response.json()) as KmsDocument;
}
