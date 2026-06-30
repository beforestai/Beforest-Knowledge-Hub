"use client";

import { useEffect, useMemo, useState } from "react";
import { collectiveReferenceGroups, overviewStorageKey } from "@/data/kmsData";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { ViewId } from "@/types/kms";

const collectiveOptions = [
  { name: "What is a Collective?", url: "https://beforest.co/farming-collectives/" },
  { name: "Poomaale 1.0", url: "https://beforest.co/the-poomaale-estate/" },
  { name: "Poomaale 2.0", url: "https://beforest.co/poomaale-2-0-collective/" },
  { name: "Hyderabad Collective", url: "https://beforest.co/hyderabad-collective/" },
  { name: "Hammiyala Collective", url: "https://beforest.co/co-forest/" },
  { name: "Bhopal Collective", url: "https://beforest.co/the-bhopal-collective/" },
  { name: "Mumbai Collective", url: "https://beforest.co/the-mumbai-collective/" }
];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function collectiveSearchMatch(value: string) {
  const query = normalizeSearch(value);
  if (!query) return false;
  return collectiveOptions.some((option) => `${option.name} ${option.url}`.toLowerCase().includes(query));
}

export function CollectiveView({ onViewChange, searchValue = "" }: { onViewChange: (view: ViewId) => void; searchValue?: string }) {
  const [selectedUrl, setSelectedUrl] = useState(collectiveOptions[0].url);
  const [overviewCache, setOverviewCache] = useLocalStorageState<Record<string, string>>(overviewStorageKey, {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const matchingOptions = useMemo(() => {
    const query = normalizeSearch(searchValue);
    if (!query) return collectiveOptions;
    return collectiveOptions.filter((option) => `${option.name} ${option.url}`.toLowerCase().includes(query));
  }, [searchValue]);
  const selected = useMemo(() => collectiveOptions.find((option) => option.url === selectedUrl) || collectiveOptions[0], [selectedUrl]);
  const cachedOverview = overviewCache[selectedUrl];

  useEffect(() => {
    if (!matchingOptions.length) return;
    setSelectedUrl(matchingOptions[0].url);
    setManualMessage("");
  }, [matchingOptions]);

  async function requestCollectiveOverview() {
    if (cachedOverview) return;

    setManualMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/collective/overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: selected.name,
          url: selected.url
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed for ${selected.name}`);
      }

      const data = await response.json();
      const overview = data.overview?.trim();
      if (!overview) throw new Error("No overview returned");
      setOverviewCache({ ...overviewCache, [selected.url]: overview });
    } catch {
      setManualMessage("Could not generate the overview. Check backend LLM configuration or try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function renderOverviewBody() {
    if (cachedOverview) {
      return <div className="overview-text">{cachedOverview}</div>;
    }

    if (isGenerating) {
      return (
        <div className="overview-loading">
          <div className="pulse-dots">
            <span />
            <span />
            <span />
          </div>
          <span>Reading {selected.url} and generating overview...</span>
        </div>
      );
    }

    return (
      <div className="overview-placeholder">
        {manualMessage || "Select a page and click Generate overview to pull an accurate summary from the live Beforest page."}
      </div>
    );
  }

  return (
    <div className="collective-page">
      <div className="collective-main">
        <section className="collective-header">
          <div className="breadcrumb">
            <button type="button" className="breadcrumb-link" onClick={() => onViewChange("home")}>
              Knowledge home
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <button type="button" className="breadcrumb-link" onClick={() => onViewChange("shared")}>
              Shared knowledge spaces
            </button>
            <span className="breadcrumb-sep">&gt;</span>
            <span>Collective-wise Information</span>
          </div>
          <div className="collective-title">Collective-wise Information</div>
          <div className="collective-meta">
            <span className="collective-tag green">Collective Webpages</span>
            <span className="collective-tag gray">Web reference</span>
            <span className="collective-updated">Last synced: Jun 18, 2026</span>
          </div>
        </section>

        <div className="collective-picker-row">
          <label htmlFor="collectivePagePicker">Preview a page:</label>
          <select
            id="collectivePagePicker"
            value={selectedUrl}
            onChange={(event) => {
              setSelectedUrl(event.target.value);
              setManualMessage("");
            }}
          >
            <optgroup label="Collective Webpages">
              {(matchingOptions.length ? matchingOptions : collectiveOptions).map((option) => (
                <option key={option.url} value={option.url}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <section className="overview-card">
          <div className="overview-head">
            <div className="overview-label">Page overview</div>
            <button type="button" className="overview-button" onClick={requestCollectiveOverview} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate overview"}
            </button>
          </div>
          <div className="overview-body">{renderOverviewBody()}</div>
          <div className="overview-footer">
            <span>Overview is generated by reading the actual Beforest webpage - not invented.</span>
            {cachedOverview ? <span className="source-badge" style={{ display: "inline-block" }}>Source verified: {selected.url}</span> : null}
          </div>
        </section>
      </div>

      <aside className="collective-sidebar">
        <section className="web-ref-card">
          <div className="web-ref-title">Web references</div>
          {collectiveReferenceGroups.map((group) => (
            <section className="web-ref-group" key={group.label}>
              <div className="web-ref-group-label">{group.label}</div>
              {group.links.map((link) => (
                <button key={link.url} type="button" className="web-ref-link" onClick={() => window.open(link.url, "_blank", "noopener")}>
                  <span className={`web-dot ${group.color}`} />
                  <span>{link.name}</span>
                </button>
              ))}
            </section>
          ))}
        </section>
      </aside>
    </div>
  );
}
