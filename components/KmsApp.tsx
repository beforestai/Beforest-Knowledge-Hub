"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { currentUser as fallbackCurrentUser, seedDocuments, storageKey, teamIdFromName, teams as fallbackTeams } from "@/data/kmsData";
import { fetchCurrentUser, fetchTeams } from "@/lib/kmsIdentityClient";
import { createDocument, fetchDocuments, updateDocument, uploadDocumentFile } from "@/lib/kmsDocumentsClient";
import type { CurrentUser, KmsDocument, KmsDocumentCreate, QuickFilter, Team, ViewId } from "@/types/kms";
import { normalize, searchableDocText, tokenizeQuery } from "@/utils/kms";
import { Shell } from "@/components/Shell";
import { Views } from "@/components/Views";
import { ChatWidget } from "@/components/ChatWidget";
import { CreatePageDialog, DetailDialog, SuccessDialog } from "@/components/Dialogs";
import { collectiveSearchMatch } from "@/components/CollectiveView";

const viewIds: ViewId[] = ["home", "teams", "documents", "recent", "shared", "collective", "templates"];

function viewFromHash(hash: string): ViewId {
  const candidate = hash.replace(/^#/, "");
  return viewIds.includes(candidate as ViewId) ? (candidate as ViewId) : "home";
}

function readLocalDocuments() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    const documents = saved ? (JSON.parse(saved) as KmsDocument[]) : seedDocuments;
    return documents.map((document) => ({ ...document, teamId: document.teamId || teamIdFromName(document.team) }));
  } catch {
    return seedDocuments;
  }
}

function writeLocalDocuments(documents: KmsDocument[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(documents));
}

export function KmsApp() {
  const [documents, setDocuments] = useState<KmsDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentError, setDocumentError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser>(fallbackCurrentUser);
  const [teams, setTeams] = useState<Team[]>(fallbackTeams);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [searchValue, setSearchValue] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>({ type: "all", value: "all" });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KmsDocument | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveView(viewFromHash(window.location.hash));
    const handleHashChange = () => setActiveView(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkspaceState() {
      setIsLoadingDocuments(true);
      setDocumentError("");
      try {
        const [backendCurrentUser, backendTeams, backendDocuments] = await Promise.all([
          fetchCurrentUser(),
          fetchTeams(),
          fetchDocuments()
        ]);
        if (isMounted) {
          setCurrentUser(backendCurrentUser);
          setTeams(backendTeams.length ? backendTeams : fallbackTeams);
          setDocuments(backendDocuments);
        }
      } catch (error) {
        if (isMounted) {
          setCurrentUser(fallbackCurrentUser);
          setTeams(fallbackTeams);
          setDocuments(readLocalDocuments());
          const message = error instanceof Error ? error.message : "Could not load KMS documents.";
          setDocumentError(`${message} Using local prototype data until the backend is available.`);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDocuments(false);
        }
      }
    }

    loadWorkspaceState();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedDocuments = useMemo(() => documents.slice().sort((a, b) => b.updated.localeCompare(a.updated)), [documents]);
  const filteredDocuments = useMemo(
    () =>
      sortedDocuments.filter((doc) => {
        const query = normalize(searchValue);
        const queryTokens = tokenizeQuery(searchValue);
        const haystack = normalize(searchableDocText(doc));
        const searchMatch = !query || haystack.includes(query) || queryTokens.some((token) => haystack.includes(token));
        const selectedTeamMatch = teamFilter === "all" || doc.team === teamFilter;
        let quickMatch = true;
        if (quickFilter.type === "team") {
          quickMatch = doc.team === quickFilter.value;
        } else if (quickFilter.type === "category") {
          quickMatch = doc.category === quickFilter.value;
        }
        return searchMatch && selectedTeamMatch && quickMatch;
      }),
    [quickFilter, searchValue, sortedDocuments, teamFilter]
  );

  const teamCounts = useMemo(() => {
    const counts = new Map<string, number>();
    teams.forEach((team) => counts.set(team.name, 0));
    documents.forEach((doc) => counts.set(doc.team, (counts.get(doc.team) || 0) + 1));
    return counts;
  }, [documents]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 2600);
  }

  function navigateToView(view: ViewId) {
    setActiveView(view);
    const nextHash = `#${view}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }

  function handleSearchSubmit(query: string) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setSearchValue(cleanQuery);
    setTeamFilter("all");
    setQuickFilter({ type: "all", value: "all" });

    const normalizedQuery = cleanQuery.toLowerCase();
    if (collectiveSearchMatch(cleanQuery) || normalizedQuery.includes("collective")) {
      navigateToView("collective");
      return;
    }

    if (teams.some((team) => `${team.name} ${team.description}`.toLowerCase().includes(normalizedQuery))) {
      navigateToView("teams");
      return;
    }

    if (normalizedQuery.includes("template") || normalizedQuery.includes("page creation guide")) {
      navigateToView("templates");
      return;
    }

    navigateToView("documents");
  }

  async function handleSaveDocument(doc: KmsDocumentCreate, mode: "draft" | "publish", file: File | null) {
    setIsSavingDocument(true);
    try {
      const savedDocument = await createDocument(doc, file);
      console.debug("[KMS attachment:react state save]", {
        id: savedDocument.id,
        title: savedDocument.title,
        file_name: savedDocument.fileName,
        file_storage_path: savedDocument.fileStoragePath,
        file_content_type: savedDocument.fileContentType,
        file_size_bytes: savedDocument.fileSizeBytes
      });
      setDocuments((current) => {
        const nextDocuments = [savedDocument, ...current.filter((item) => item.id !== savedDocument.id)];
        const storedDocument = nextDocuments.find((item) => item.id === savedDocument.id);
        console.debug("[KMS attachment:react state stored]", {
          id: storedDocument?.id,
          title: storedDocument?.title,
          file_name: storedDocument?.fileName,
          file_storage_path: storedDocument?.fileStoragePath,
          file_content_type: storedDocument?.fileContentType,
          file_size_bytes: storedDocument?.fileSizeBytes
        });
        return nextDocuments;
      });
      setCreateOpen(false);
      navigateToView("documents");

      if (file && mode !== "draft") {
        if (savedDocument.ingestionStatus === "enqueue_failed") {
          showToast("Page and file saved. Ingestion queue could not be started.");
        } else {
          setSuccessOpen(true);
        }
        return;
      }

      showToast(mode === "draft" ? "Draft saved." : "Page published.");
    } catch (error) {
      if (file) {
        showToast(error instanceof Error ? error.message : "Could not upload the supporting file.");
        throw error;
      }

      const localDocument: KmsDocument = {
        ...doc,
        id: `local-${Date.now()}`,
        fileStoragePath: "",
        fileSizeBytes: null,
        fileContentType: "",
        ingestionStatus: "not_required",
        ingestionJobId: "",
        ingestionError: "",
        ingestionChunkCount: 0,
        ingestedAt: null
      };
      setDocuments((current) => {
        const nextDocuments = [localDocument, ...current.filter((item) => item.id !== localDocument.id)];
        writeLocalDocuments(nextDocuments);
        return nextDocuments;
      });
      setCreateOpen(false);
      navigateToView("documents");
      showToast("Backend unavailable. Page saved locally for this prototype.");
    } finally {
      setIsSavingDocument(false);
    }
  }

  async function handleUpdateDocument(documentId: string, updates: Partial<KmsDocumentCreate>, file: File | null) {
    setIsSavingDocument(true);
    try {
      let savedDocument = await updateDocument(documentId, updates);
      if (file) {
        savedDocument = await uploadDocumentFile(documentId, file);
      }
      setDocuments((current) => current.map((item) => (item.id === savedDocument.id ? savedDocument : item)));
      setSelectedDoc(savedDocument);
      showToast(
        file && savedDocument.ingestionStatus === "enqueue_failed"
          ? "Page and file updated. Ingestion queue could not be started."
          : file
            ? "Page updated and file uploaded."
            : "Page updated."
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update this page.");
      throw error;
    } finally {
      setIsSavingDocument(false);
    }
  }

  function handleTeamOpen(teamName: string) {
    setTeamFilter(teamName);
    setQuickFilter({ type: "all", value: "all" });
    navigateToView("documents");
  }

  return (
    <>
      <Shell
        activeView={activeView}
        searchValue={searchValue}
        onViewChange={navigateToView}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onCreatePage={() => setCreateOpen(true)}
        currentUser={currentUser}
      >
        <select className="hidden-control" aria-hidden="true" tabIndex={-1} value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team.name} value={team.name}>
              {team.name}
            </option>
          ))}
        </select>
        {isLoadingDocuments ? (
          <section className="panel" style={{ marginBottom: 18 }}>
            <h2>Loading KMS pages</h2>
            <div className="subtle">Fetching pages from the backend API.</div>
          </section>
        ) : null}
        {documentError ? (
          <section className="panel" style={{ marginBottom: 18 }}>
            <h2>Backend unavailable</h2>
            <div className="subtle">{documentError}</div>
          </section>
        ) : null}
        <Views
          activeView={activeView}
          filteredDocuments={filteredDocuments}
          sortedDocuments={sortedDocuments}
          quickFilter={quickFilter}
          documentCount={documents.length}
          teamCounts={teamCounts}
          teams={teams}
          onQuickFilterChange={(filter) => {
            setTeamFilter("all");
            setQuickFilter(filter);
          }}
          onOpenDoc={setSelectedDoc}
          onTeamOpen={handleTeamOpen}
          onViewChange={navigateToView}
          currentUser={currentUser}
          searchValue={searchValue}
        />
      </Shell>
      <ChatBridge documents={documents} onOpenDoc={setSelectedDoc} />
      <CreatePageDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleSaveDocument} isSaving={isSavingDocument} currentUser={currentUser} />
      <DetailDialog doc={selectedDoc} onClose={() => setSelectedDoc(null)} currentUser={currentUser} onSave={handleUpdateDocument} isSaving={isSavingDocument} />
      <SuccessDialog open={successOpen} onClose={() => setSuccessOpen(false)} />
      <div className={`toast${toast ? " visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}

function ChatBridge({ documents, onOpenDoc }: { documents: KmsDocument[]; onOpenDoc: (doc: KmsDocument) => void }) {
  return <ChatWidget documents={documents} onOpenDoc={onOpenDoc} />;
}
