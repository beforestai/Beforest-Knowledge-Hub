"use client";

import type { CurrentUser, KmsDocument, QuickFilter, Team, ViewId } from "@/types/kms";
import { BookIcon, CheckIcon, DocumentIcon, SearchIcon } from "@/components/icons";
import { ActivityList, DocumentCard, RecentRow, TeamCard } from "@/components/cards";
import { CollectiveView } from "@/components/CollectiveView";

type SharedViewProps = {
  activeView: ViewId;
  filteredDocuments: KmsDocument[];
  sortedDocuments: KmsDocument[];
  quickFilter: QuickFilter;
  documentCount: number;
  teamCounts: Map<string, number>;
  teams: Team[];
  onQuickFilterChange: (filter: QuickFilter) => void;
  onOpenDoc: (doc: KmsDocument) => void;
  onTeamOpen: (teamName: string) => void;
  onViewChange: (view: ViewId) => void;
  currentUser: CurrentUser;
};

export function Views(props: SharedViewProps) {
  const { activeView } = props;
  return (
    <>
      <ViewFrame id="home" activeView={activeView}>
        <HomeView {...props} />
      </ViewFrame>
      <ViewFrame id="recent" activeView={activeView}>
        <RecentView {...props} />
      </ViewFrame>
      <ViewFrame id="teams" activeView={activeView}>
        <TeamsView teams={props.teams} teamCounts={props.teamCounts} onTeamOpen={props.onTeamOpen} currentUser={props.currentUser} />
      </ViewFrame>
      <ViewFrame id="documents" activeView={activeView}>
        <DocumentsView documents={props.filteredDocuments} onOpenDoc={props.onOpenDoc} />
      </ViewFrame>
      <ViewFrame id="shared" activeView={activeView}>
        <SharedKnowledgeView onViewChange={props.onViewChange} />
      </ViewFrame>
      <ViewFrame id="collective" activeView={activeView}>
        <CollectiveView onViewChange={props.onViewChange} />
      </ViewFrame>
      <ViewFrame id="glossary" activeView={activeView}>
        <GlossaryView />
      </ViewFrame>
      <ViewFrame id="templates" activeView={activeView}>
        <TemplatesView />
      </ViewFrame>
    </>
  );
}

function ViewFrame({ id, activeView, children }: { id: ViewId; activeView: ViewId; children: React.ReactNode }) {
  return (
    <section id={id} className={`view${activeView === id ? " active" : ""}`}>
      {children}
    </section>
  );
}

function HomeView({
  filteredDocuments,
  sortedDocuments,
  quickFilter,
  documentCount,
  teamCounts,
  teams,
  onQuickFilterChange,
  onOpenDoc,
  onTeamOpen,
  onViewChange,
  currentUser
}: SharedViewProps) {
  const visibleTeams = teams.slice(0, 9);

  return (
    <>
      <div className="greeting">
        <h1>Good morning, Demo</h1>
        <div className="subtle">Here is what is happening across Beforest&apos;s knowledge base today.</div>
        <div className="inline-stats">
          <span className="stat-pill">
            <strong>{teams.length}</strong> teams
          </span>
          <span className="stat-pill">
            <strong>{documentCount}</strong> pages
          </span>
          <span className="stat-pill">4 shared spaces</span>
        </div>
      </div>

      <QuickFilters quickFilter={quickFilter} onQuickFilterChange={onQuickFilterChange} currentUser={currentUser} />

      <section className="home-layout">
        <div>
          <section className="section-header">
            <h2>Recently updated</h2>
            <button type="button" className="section-link" onClick={() => onViewChange("recent")}>
              View all
            </button>
          </section>
          <div className="recent-list">
            {filteredDocuments.slice(0, 4).map((doc) => (
              <RecentRow key={doc.id} doc={doc} onOpen={onOpenDoc} />
            ))}
          </div>
          <Empty visible={filteredDocuments.length === 0}>No matching pages found.</Empty>

          <section className="section-header" style={{ marginTop: 20 }}>
            <h2>Team knowledge spaces</h2>
            <button type="button" className="section-link" onClick={() => onViewChange("teams")}>
              See all teams
            </button>
          </section>
          <TeamGrid teams={visibleTeams} teamCounts={teamCounts} onTeamOpen={onTeamOpen} currentUser={currentUser} />
        </div>

        <aside className="right-col">
          <section className="ref-card">
            <div className="ref-label">Common References</div>
            <div className="ref-list">
              <div className="ref-item">
                <div className="ref-icon">F</div>
                <div className="ref-item-text">
                  <div className="label">FAQs</div>
                  <div className="desc">Common question-and-answer content teams can reuse.</div>
                </div>
              </div>
              <div className="ref-item">
                <div className="ref-icon">C</div>
                <button type="button" className="ref-item-button" onClick={() => onViewChange("collective")}>
                  <div className="ref-item-text">
                    <div className="label">Collective-wise Information</div>
                    <div className="desc">Collective details, operational context, and shared references.</div>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section className="activity-card">
            <div className="ref-label">Recent Activity</div>
            <ActivityList documents={sortedDocuments} />
          </section>
        </aside>
      </section>
    </>
  );
}

function QuickFilters({
  quickFilter,
  onQuickFilterChange,
  currentUser
}: {
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  currentUser: CurrentUser;
}) {
  const filters: Array<QuickFilter & { label: string }> = [
    { type: "all", value: "all", label: "All teams" },
    { type: "team", value: currentUser.team, label: "My team" },
    { type: "category", value: "SOP", label: "SOPs" },
    { type: "category", value: "FAQ", label: "FAQs" },
    { type: "category", value: "Reports", label: "Reports" }
  ];

  return (
    <div className="filter-row" aria-label="Quick filters">
      {filters.map((filter) => {
        const isActive =
          (quickFilter.type === "all" && filter.type === "all") ||
          (quickFilter.type === filter.type && quickFilter.value === filter.value);
        return (
          <button
            key={`${filter.type}-${filter.value}`}
            type="button"
            className={`filter-chip${isActive ? " active" : ""}`}
            onClick={() => onQuickFilterChange({ type: filter.type, value: filter.value })}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function RecentView({ filteredDocuments, onOpenDoc, onViewChange }: SharedViewProps) {
  return (
    <>
      <section className="panel">
        <div className="section-header">
          <h2>Recently Updated</h2>
          <button type="button" className="section-link" onClick={() => onViewChange("documents")}>
            Open all pages
          </button>
        </div>
        <div className="subtle">Most recently updated knowledge pages across all teams.</div>
      </section>
      <div className="recent-list">
        {filteredDocuments.map((doc) => (
          <RecentRow key={doc.id} doc={doc} onOpen={onOpenDoc} />
        ))}
      </div>
      <Empty visible={filteredDocuments.length === 0}>No matching pages found.</Empty>
    </>
  );
}

function TeamsView({
  teams,
  teamCounts,
  onTeamOpen,
  currentUser
}: {
  teams: Team[];
  teamCounts: Map<string, number>;
  onTeamOpen: (teamName: string) => void;
  currentUser: CurrentUser;
}) {
  return (
    <section className="panel">
      <h2>All Pilot Team Spaces</h2>
      <TeamGrid teams={teams} teamCounts={teamCounts} onTeamOpen={onTeamOpen} currentUser={currentUser} />
    </section>
  );
}

function TeamGrid({
  teams: teamList,
  teamCounts,
  onTeamOpen,
  currentUser
}: {
  teams: Team[];
  teamCounts: Map<string, number>;
  onTeamOpen: (teamName: string) => void;
  currentUser: CurrentUser;
}) {
  return (
    <div className="team-grid">
      {teamList.map((team) => (
        <TeamCard key={team.name} team={team} count={teamCounts.get(team.name) || 0} onOpen={onTeamOpen} isCurrentUserTeam={team.id === currentUser.teamId} />
      ))}
    </div>
  );
}

function DocumentsView({ documents, onOpenDoc }: { documents: KmsDocument[]; onOpenDoc: (doc: KmsDocument) => void }) {
  return (
    <>
      <section className="panel">
        <h2>All Pages</h2>
        <div className="subtle">This prototype shows how teams create pages and find knowledge. If the backend is offline, pages are saved locally in this browser.</div>
      </section>
      <div className="docs">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onOpen={onOpenDoc} />
        ))}
      </div>
      <Empty visible={documents.length === 0}>No matching pages found.</Empty>
    </>
  );
}

function SharedKnowledgeView({ onViewChange }: { onViewChange: (view: ViewId) => void }) {
  return (
    <>
      <section className="panel">
        <h2>Shared Knowledge Spaces</h2>
        <div className="subtle">Common reference spaces that are useful across teams.</div>
      </section>
      <div className="docs">
        <article className="doc">
          <div>
            <h3>Collective-wise Information</h3>
            <div className="subtle">Source-backed collective webpages and web references.</div>
          </div>
          <div className="doc-actions">
            <button type="button" className="secondary" onClick={() => onViewChange("collective")}>
              Open
            </button>
          </div>
        </article>
        <article className="doc">
          <div>
            <h3>Templates</h3>
            <div className="subtle">Page details and creation guidelines for teams.</div>
          </div>
          <div className="doc-actions">
            <button type="button" className="secondary" onClick={() => onViewChange("templates")}>
              Open
            </button>
          </div>
        </article>
      </div>
    </>
  );
}

function GlossaryView() {
  return (
    <div className="glossary-page">
      <section className="glossary-coming">
        <div className="coming-badge">Coming soon</div>
        <h2>AI-powered glossary</h2>
        <div className="coming-copy">
          <div>Glossary terms will be automatically built by an agent that reads new KMS pages, identifies Beforest-specific terms, and generates accurate definitions from live source pages.</div>
          <div>No manual entry needed - the agent keeps the glossary updated as knowledge grows.</div>
        </div>
        <div className="glossary-steps" aria-label="Glossary automation steps">
          <span className="step-chip">
            <span className="step-icon" aria-hidden="true">
              <DocumentIcon />
            </span>
            New page saved
          </span>
          <span className="step-arrow">&gt;</span>
          <span className="step-chip">
            <span className="step-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            Agent extracts terms
          </span>
          <span className="step-arrow">&gt;</span>
          <span className="step-chip">
            <span className="step-icon" aria-hidden="true">
              <CheckIcon />
            </span>
            Definition published
          </span>
        </div>
      </section>

      <section className="glossary-terms-card">
        <div className="glossary-card-head">
          <div className="glossary-label">Glossary terms</div>
          <div className="terms-count">0 terms</div>
        </div>
        <input className="glossary-search" type="search" placeholder="Search terms..." disabled />
        <div className="glossary-empty">
          <div className="book-icon" aria-hidden="true">
            <BookIcon />
          </div>
          <div className="glossary-empty-title">No glossary terms yet</div>
          <div className="glossary-empty-subtext">Terms will appear here automatically once the agent is active and pages are added to the KMS.</div>
        </div>
      </section>
    </div>
  );
}

function TemplatesView() {
  return (
    <>
      <section className="panel">
        <h2>Templates</h2>
        <div className="subtle">Templates keep pages consistent across teams and prepare content for future search and chat citations.</div>
      </section>
      <div className="templates">
        <article className="template-card">
          <h3>Page Details Template</h3>
          <div className="subtle">Use these details when creating any knowledge page in the KMS.</div>
          <div className="template">
            title:<br />
            team_owner:<br />
            category:<br />
            topic:<br />
            summary:<br />
            rich_text_content:<br />
            keywords:<br />
            related_teams:<br />
            source_link:<br />
            last_updated:
          </div>
        </article>
        <article className="template-card">
          <h3>Page Creation Guidelines</h3>
          <div className="subtle">Create a page directly when your team owns the topic. Attach files only when they add useful supporting context.</div>
          <div className="meta">
            <span className="pill">No approval needed</span>
            <span className="pill">Clear title</span>
            <span className="pill">Owner maintains updates</span>
          </div>
        </article>
      </div>
    </>
  );
}

function Empty({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <div className={`empty${visible ? " visible" : ""}`}>{children}</div>;
}
