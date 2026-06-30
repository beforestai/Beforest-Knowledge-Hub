"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrentUser, KmsDocument, KmsDocumentCreate } from "@/types/kms";
import { fileTypeFromName, pagePathForDoc, slugify } from "@/utils/kms";
import { ImageIcon, LinkIcon, TableIcon, UploadIcon } from "@/components/icons";

type CreatePageDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (doc: KmsDocumentCreate, mode: "draft" | "publish", file: File | null) => void | Promise<void>;
  isSaving?: boolean;
  currentUser: CurrentUser;
};

export function CreatePageDialog({ open, onClose, onSave, isSaving = false, currentUser }: CreatePageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [contentError, setContentError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useDialogOpen(dialogRef, open, onClose);

  function exec(command: string, value?: string) {
    contentRef.current?.focus();
    document.execCommand(command, false, value || undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = selectedFile;
    const title = String(data.get("title") || "").trim();
    const richContent = contentRef.current?.innerHTML.trim() || "";
    setContentError(false);

    const doc: KmsDocumentCreate = {
      title,
      slug: slugify(title),
      teamId: currentUser.teamId,
      team: currentUser.team,
      category: "Knowledge Page",
      summary: String(data.get("summary") || "").trim(),
      content: richContent,
      fileType: file ? fileTypeFromName(file.name) : "Text Page",
      fileName: file ? file.name : "No supporting file attached",
      tags: String(data.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      relatedTeams: String(data.get("related") || "")
        .split(",")
        .map((team) => team.trim())
        .filter(Boolean),
      sourceLink: String(data.get("source") || "").trim(),
      updated: new Date().toISOString().slice(0, 10)
    };

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    try {
      await onSave(doc, submitter?.id === "saveDraft" ? "draft" : "publish", file);
    } catch {
      return;
    }
    form.reset();
    setSelectedFile(null);
    if (contentRef.current) contentRef.current.innerHTML = "";
  }

  return (
    <dialog ref={dialogRef}>
      <form method="dialog" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Create knowledge page</h2>
            <div className="subtle">Page details are saved to the KMS backend.</div>
          </div>
          <button type="button" className="secondary" onClick={onClose} disabled={isSaving}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="titleInput">Title</label>
              <input id="titleInput" name="title" required placeholder="Give your page a clear, specific title" />
            </div>
            <div className="form-row">
              <label>Team owner</label>
              <div className="readonly-field">{currentUser.team}</div>
            </div>
            <div className="form-row full">
              <label htmlFor="summaryInput">Topic / summary</label>
              <textarea id="summaryInput" name="summary" rows={2} required placeholder="One sentence describing what this page covers and who it's for. This is what other teams see when searching." />
              <div className="field-hint">Keep it short - this appears in search results.</div>
            </div>
            <div className="form-row full">
              <label htmlFor="contentInput">Page content, optional</label>
              <div className={`rtf-editor${contentError ? " invalid" : ""}`}>
                <div className="rtf-toolbar" aria-label="Rich text formatting">
                  <button type="button" title="Heading" onClick={() => exec("formatBlock", "H2")}>
                    H
                  </button>
                  <button type="button" title="Bold" onClick={() => exec("bold")}>
                    B
                  </button>
                  <button type="button" title="Italic" onClick={() => exec("italic")}>
                    <i>I</i>
                  </button>
                  <button type="button" title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
                    UL
                  </button>
                  <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")}>
                    OL
                  </button>
                  <button type="button" title="Insert table" aria-label="Insert table" onClick={() => exec("insertHTML", "<table border='1' cellpadding='6' cellspacing='0'><tbody><tr><td>Column 1</td><td>Column 2</td></tr><tr><td></td><td></td></tr></tbody></table>")}>
                    <TableIcon />
                  </button>
                  <button
                    type="button"
                    title="Add link"
                    aria-label="Add link"
                    onClick={() => {
                      const url = window.prompt("Enter link URL");
                      if (url) exec("createLink", url);
                    }}
                  >
                    <LinkIcon />
                  </button>
                  <button type="button" title="Add image" aria-label="Add image" onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon />
                  </button>
                </div>
                <input
                  ref={imageInputRef}
                  className="hidden-control"
                  type="file"
                  accept="image/*"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.addEventListener("load", () => {
                      exec("insertHTML", `<img src="${reader.result}" alt="${file.name}" />`);
                      setContentError(false);
                      event.target.value = "";
                    });
                    reader.readAsDataURL(file);
                  }}
                />
                <div
                  id="contentInput"
                  ref={contentRef}
                  className="rtf-box"
                  contentEditable
                  role="textbox"
                  aria-multiline="true"
                  data-placeholder="Write page content here only if needed."
                  onInput={() => setContentError(false)}
                  suppressContentEditableWarning
                />
              </div>
              <div className="field-hint">Optional. Use this when you want to create a page without attaching a document.</div>
              <div className={`field-error${contentError ? " visible" : ""}`}>Page content is optional.</div>
            </div>
            <div className="form-row">
              <label htmlFor="tagsInput">Keywords</label>
              <input id="tagsInput" name="tags" placeholder="e.g. guest, check-in, bungalow" />
              <div className="field-hint">Comma separated. Helps with search.</div>
            </div>
            <div className="form-row">
              <label htmlFor="relatedInput">Related teams</label>
              <input id="relatedInput" name="related" placeholder="e.g. Marketing, Operations" />
              <div className="field-hint">Teams that should know about this page.</div>
            </div>
            <div className="form-row">
              <label htmlFor="sourceInput">Source link, optional</label>
              <input id="sourceInput" name="source" type="url" placeholder="https://..." />
            </div>
            <div className="form-row">
              <label htmlFor="fileInput">Supporting file, optional</label>
              <AttachmentPicker
                inputId="fileInput"
                inputName="file"
                selectedFile={selectedFile}
                emptyLabel="Choose file to attach"
                onFileChange={setSelectedFile}
              />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <div className="publish-note">
            <span className="info-icon">i</span>No approval needed - page is published immediately.
          </div>
          <div className="modal-actions">
            <button type="submit" className="secondary" id="saveDraft" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button type="submit" className="publish-button" id="publishPage" disabled={isSaving}>
              {isSaving ? "Publishing..." : "Publish page"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export function DetailDialog({
  doc,
  onClose,
  currentUser,
  onSave,
  isSaving = false
}: {
  doc: KmsDocument | null;
  onClose: () => void;
  currentUser: CurrentUser;
  onSave: (documentId: string, updates: Partial<KmsDocumentCreate>, file: File | null) => void | Promise<void>;
  isSaving?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  useDialogOpen(dialogRef, Boolean(doc), onClose);

  useEffect(() => {
    setIsEditing(false);
    setSelectedFile(null);
    if (doc) {
      console.debug("[KMS attachment:page details received]", {
        id: doc.id,
        title: doc.title,
        file_name: doc.fileName,
        file_storage_path: doc.fileStoragePath,
        file_content_type: doc.fileContentType,
        file_size_bytes: doc.fileSizeBytes
      });
    }
  }, [doc?.id]);

  const canEdit = Boolean(doc && doc.teamId === currentUser.teamId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!doc || !canEdit) return;
    const data = new FormData(event.currentTarget);
    await onSave(
      doc.id,
      {
        title: String(data.get("title") || "").trim(),
        slug: slugify(String(data.get("title") || doc.title)),
        teamId: doc.teamId,
        team: doc.team,
        category: doc.category,
        summary: String(data.get("summary") || "").trim(),
        content: String(data.get("content") || ""),
        fileType: doc.fileType,
        fileName: doc.fileName,
        fileStoragePath: doc.fileStoragePath,
        fileSizeBytes: doc.fileSizeBytes,
        fileContentType: doc.fileContentType,
        ingestionStatus: doc.ingestionStatus,
        ingestionJobId: doc.ingestionJobId,
        ingestionError: doc.ingestionError,
        ingestionChunkCount: doc.ingestionChunkCount,
        ingestedAt: doc.ingestedAt,
        tags: String(data.get("tags") || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        relatedTeams: String(data.get("relatedTeams") || "")
          .split(",")
          .map((team) => team.trim())
          .filter(Boolean),
        sourceLink: String(data.get("sourceLink") || "").trim(),
        updated: new Date().toISOString().slice(0, 10)
      },
      selectedFile
    );
    setIsEditing(false);
    setSelectedFile(null);
  }

  return (
    <dialog ref={dialogRef}>
      <form method="dialog" onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <h2>{doc?.title || "Page details"}</h2>
            <div className="subtle">{doc ? `${doc.team} - ${doc.category}` : ""}</div>
          </div>
          <div className="modal-actions">
            {doc && canEdit && !isEditing ? (
              <button type="button" className="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            ) : null}
            <button type="button" className="secondary" onClick={onClose} disabled={isSaving}>
              Close
            </button>
          </div>
        </div>
        {doc ? (
          <div className="modal-body">
            {!canEdit ? <div className="readonly-notice">This page belongs to another team and can only be viewed.</div> : null}
            {isEditing && canEdit ? (
              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="editTitle">Title</label>
                  <input id="editTitle" name="title" defaultValue={doc.title} required />
                </div>
                <div className="form-row">
                  <label>Team owner</label>
                  <div className="readonly-field">{doc.team}</div>
                </div>
                <div className="form-row full">
                  <label htmlFor="editSummary">Topic / summary</label>
                  <textarea id="editSummary" name="summary" rows={2} defaultValue={doc.summary} required />
                </div>
                <div className="form-row full">
                  <label htmlFor="editContent">Page content</label>
                  <textarea id="editContent" name="content" rows={8} defaultValue={doc.content} />
                </div>
                <div className="form-row">
                  <label htmlFor="editTags">Keywords</label>
                  <input id="editTags" name="tags" defaultValue={doc.tags.join(", ")} />
                </div>
                <div className="form-row">
                  <label htmlFor="editRelatedTeams">Related teams</label>
                  <input id="editRelatedTeams" name="relatedTeams" defaultValue={doc.relatedTeams.join(", ")} />
                </div>
                <div className="form-row">
                  <label htmlFor="editSourceLink">Source link</label>
                  <input id="editSourceLink" name="sourceLink" type="url" defaultValue={doc.sourceLink} />
                </div>
                <div className="form-row">
                  <label htmlFor="editFileInput">Supporting file</label>
                  <AttachmentPicker
                    inputId="editFileInput"
                    inputName="file"
                    selectedFile={selectedFile}
                    emptyLabel="Choose replacement file"
                    onFileChange={setSelectedFile}
                  />
                </div>
              </div>
            ) : (
              <div className="detail-grid">
                <b>Summary</b>
                <span>{doc.summary}</span>
                <b>Page content</b>
                <span className="rich-preview" dangerouslySetInnerHTML={{ __html: doc.content || "No rich text content added yet" }} />
                <b>KMS citation</b>
                <span>{pagePathForDoc(doc)}</span>
                <b>Supporting file</b>
                <SupportingFileLink doc={doc} />
                <b>Storage path</b>
                <span>{doc.fileStoragePath || "Not uploaded"}</span>
                <b>File metadata</b>
                <span>
                  {doc.fileSizeBytes ? `${doc.fileSizeBytes} bytes` : "No size recorded"}
                  {doc.fileContentType ? ` - ${doc.fileContentType}` : ""}
                </span>
                <b>Ingestion status</b>
                <span>
                  {doc.ingestionStatus || "not_required"}
                  {typeof doc.ingestionChunkCount === "number" ? ` - ${doc.ingestionChunkCount} chunks` : ""}
                  {doc.ingestionJobId ? ` - job ${doc.ingestionJobId}` : ""}
                  {doc.ingestionError ? ` - ${doc.ingestionError}` : ""}
                </span>
                <b>Keywords</b>
                <span>{doc.tags.join(", ") || "None"}</span>
                <b>Related teams</b>
                <span>{doc.relatedTeams.join(", ") || "None"}</span>
                <b>Source link</b>
                {doc.sourceLink ? (
                  <a href={doc.sourceLink} target="_blank" rel="noopener noreferrer">
                    {doc.sourceLink}
                  </a>
                ) : (
                  <span>Not provided</span>
                )}
                <b>Last updated</b>
                <span>{doc.updated}</span>
              </div>
            )}
          </div>
        ) : null}
        {doc && canEdit && isEditing ? (
          <div className="modal-foot">
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="publish-button" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </dialog>
  );
}

export function SuccessDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogOpen(dialogRef, open, onClose);

  return (
    <dialog ref={dialogRef} className="success-dialog">
      <div className="success-body">
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <div className="success-title">Document uploaded successfully.</div>
        <div className="success-copy">Your document has been added to the KMS backend and is available in All Pages.</div>
        <button type="button" onClick={onClose}>
          OK
        </button>
      </div>
    </dialog>
  );
}

function AttachmentPicker({
  inputId,
  inputName,
  selectedFile,
  emptyLabel,
  onFileChange
}: {
  inputId: string;
  inputName: string;
  selectedFile: File | null;
  emptyLabel: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <label className={`file-upload${selectedFile ? " has-file" : ""}`} htmlFor={inputId}>
      <UploadIcon />
      <span>{selectedFile ? selectedFile.name : emptyLabel}</span>
      <input
        id={inputId}
        name={inputName}
        type="file"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}

function SupportingFileLink({ doc }: { doc: KmsDocument }) {
  const hasFile = Boolean(doc.fileStoragePath && doc.fileName && doc.fileName !== "No supporting file attached");
  if (process.env.NODE_ENV !== "production") {
    console.debug("[KMS attachment:details]", {
      id: doc.id,
      hasFile,
      fileName: doc.fileName,
      fileStoragePath: doc.fileStoragePath,
      fileContentType: doc.fileContentType,
      fileSizeBytes: doc.fileSizeBytes
    });
  }

  if (!hasFile) {
    return <span>No supporting file attached</span>;
  }

  return (
    <a className="attachment-link" href={`/api/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer">
      <UploadIcon />
      <span>{doc.fileName}</span>
    </a>
  );
}

function useDialogOpen(ref: React.RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, ref]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, ref]);
}
