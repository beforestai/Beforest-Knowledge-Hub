"use client";

import type { KmsDocument, Team } from "@/types/kms";
import { formatDateLabel, initialsFromTeam, pageToneClass } from "@/utils/kms";

type DocumentProps = {
  doc: KmsDocument;
  onOpen: (doc: KmsDocument) => void;
};

export function RecentRow({ doc, onOpen }: DocumentProps) {
  return (
    <article className="page-row" onClick={() => onOpen(doc)}>
      <div className={`page-icon ${pageToneClass(doc.team)}`}>{initialsFromTeam(doc.team)}</div>
      <div className="page-meta">
        <div className="page-title">{doc.title}</div>
        <div className="page-sub">
          {doc.team} - Updated {formatDateLabel(doc.updated)}
        </div>
      </div>
      <div className="page-tag">{doc.category}</div>
    </article>
  );
}

export function DocumentCard({ doc, onOpen }: DocumentProps) {
  return (
    <article className="doc">
      <div>
        <h3>{doc.title}</h3>
        <div className="subtle">{doc.summary}</div>
        <div className="meta">
          <span className="pill">{doc.team}</span>
          <span className="pill">{doc.fileType}</span>
        </div>
      </div>
      <div className="doc-actions">
        <span className="subtle">Updated {doc.updated}</span>
        <button type="button" className="secondary" onClick={() => onOpen(doc)}>
          Open page
        </button>
        <button type="button" className="secondary" onClick={() => onOpen(doc)}>
          View details
        </button>
      </div>
    </article>
  );
}

type TeamCardProps = {
  team: Team;
  count: number;
  onOpen: (teamName: string) => void;
  isCurrentUserTeam: boolean;
};

export function TeamCard({ team, count, onOpen, isCurrentUserTeam }: TeamCardProps) {
  return (
    <article className={`team${isCurrentUserTeam ? " you-space" : ""}`} onClick={() => onOpen(team.name)}>
      <b>{team.name}</b>
      <span className="subtle">{team.description}</span>
      <div className="meta">
        <span className="pill">{count} pages</span>
      </div>
    </article>
  );
}

type ActivityListProps = {
  documents: KmsDocument[];
};

export function ActivityList({ documents }: ActivityListProps) {
  return (
    <div className="activity-list">
      {documents.slice(0, 4).map((doc) => (
        <article className="activity-item" key={doc.id}>
          <div className="act-dot">+</div>
          <div>
            <div className="act-text">
              <strong>{doc.team}</strong> updated <strong>{doc.title}</strong>
            </div>
            <div className="act-time">{formatDateLabel(doc.updated)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
