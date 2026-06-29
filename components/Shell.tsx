"use client";

import type { CurrentUser, ViewId } from "@/types/kms";

const primaryNav: Array<{ id: ViewId; label: string }> = [
  { id: "home", label: "Knowledge Home" },
  { id: "teams", label: "Team Spaces" },
  { id: "documents", label: "All Pages" },
  { id: "recent", label: "Recently Updated" }
];

const sharedNav: Array<{ id: ViewId; label: string }> = [
  { id: "collective", label: "Collective-wise Information" },
  { id: "glossary", label: "Glossary" },
  { id: "templates", label: "Templates" }
];

type ShellProps = {
  activeView: ViewId;
  searchValue: string;
  onViewChange: (view: ViewId) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (question: string) => void;
  onCreatePage: () => void;
  currentUser: CurrentUser;
  children: React.ReactNode;
};

export function Shell({
  activeView,
  searchValue,
  onViewChange,
  onSearchChange,
  onSearchSubmit,
  onCreatePage,
  currentUser,
  children
}: ShellProps) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand">Beforest KMS</div>
          <div className="subtle">Organization knowledge hub</div>
        </div>
        <nav aria-label="Primary navigation">
          <div className="nav-group-label">Navigate</div>
          {primaryNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeView === item.id ? " active" : ""}`}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <span className="dot" />
              {item.label}
            </button>
          ))}
          <div className="nav-group-label">Shared Knowledge Spaces</div>
          {sharedNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeView === item.id ? " active" : ""}`}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <span className="dot" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <div className="topbar">
          <div className="search-wrap">
            <input
              type="search"
              placeholder="Search pages, teams, topics, keywords..."
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                const question = searchValue.trim();
                if (!question) return;
                event.preventDefault();
                onSearchSubmit(question);
              }}
            />
          </div>
          <div className="topbar-right">
            <div className="user-chip">
              <span className="avatar">{currentUser.initials}</span>
              <span>
                {currentUser.name} - {currentUser.team}
              </span>
            </div>
            <button className="btn-create" onClick={onCreatePage} type="button">
              + Create Page
            </button>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
