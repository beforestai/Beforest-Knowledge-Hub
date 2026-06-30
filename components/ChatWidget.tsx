"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { teamIdFromName } from "@/data/kmsData";
import type { ChatCitation, ChatMessage, KmsDocument } from "@/types/kms";
import { buildLocalChatAnswer, citationLabel, findRelevantDocuments, pagePathForDoc } from "@/utils/kms";

type ChatWidgetProps = {
  documents: KmsDocument[];
  onOpenDoc: (doc: KmsDocument) => void;
};

type RagCitationResponse = {
  documentId: string;
  title: string;
  slug: string;
  teamId?: string;
  team: string;
  category: string;
  summary: string;
  fileType: string;
  fileName: string;
  sourceLink: string;
  updated: string;
  chunkId: string;
  chunkIndex: number;
  chunkText: string;
  citationLink: string;
  distance: number;
};

type RagAnswerResponse = {
  answer: string;
  citations: RagCitationResponse[];
};

const suggestedQuestions = [
  "What do we know about guest stay information?",
  "Show collective onboarding references.",
  "Which pages mention marketing or reusable copy?",
  "What finance process is documented?"
];

export function ChatWidget({ documents, onOpenDoc }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask a question about the KMS. I will search local demo pages and show citation links for the sources I used."
    }
  ]);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const submitChatQuestion = useCallback(async (value: string) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion) return;

    setIsOpen(true);
    const loadingId = `loading-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: cleanQuestion },
      { id: loadingId, role: "assistant", text: "Searching KMS pages and preparing a cited answer...", loading: true }
    ]);

    const result = await askKmsAssistant(cleanQuestion);
    setMessages((current) =>
      current.map((message) =>
        message.id === loadingId
          ? {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              text: result.answer,
              citations: result.citations
            }
          : message
      )
    );
  }, [documents]);

  async function askKmsAssistant(value: string): Promise<{ answer: string; citations: ChatCitation[] }> {
    try {
      const response = await fetch("/api/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: value,
          limit: 6
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Chat answer request failed");
      }

      const data = (await response.json()) as RagAnswerResponse;
      return {
        answer: data.answer,
        citations: data.citations.map(toChatCitation)
      };
    } catch (error) {
      const localMatches = findRelevantDocuments(value, documents);
      return {
        answer: buildLocalChatAnswer(value, localMatches),
        citations: localMatches.map(toLocalChatCitation)
      };
    }
  }

  function toLocalChatCitation(document: KmsDocument, index: number): ChatCitation {
    return {
      ...document,
      citationLink: pagePathForDoc(document),
      chunkId: `local-${document.id}`,
      chunkIndex: index,
      chunkText: document.content || document.summary,
      distance: 0
    };
  }

  function toChatCitation(citation: RagCitationResponse): ChatCitation {
    const existingDocument = documents.find((document) => document.id === citation.documentId);
    return {
      ...(existingDocument ?? {
        id: citation.documentId,
        title: citation.title,
        slug: citation.slug,
        teamId: citation.teamId || teamIdFromName(citation.team),
        team: citation.team,
        category: citation.category,
        summary: citation.summary,
        content: citation.chunkText,
        fileType: citation.fileType,
        fileName: citation.fileName,
        tags: [],
        relatedTeams: [],
        sourceLink: citation.sourceLink,
        updated: citation.updated
      }),
      citationLink: citation.citationLink,
      chunkId: citation.chunkId,
      chunkIndex: citation.chunkIndex,
      chunkText: citation.chunkText,
      distance: citation.distance
    };
  }

  return (
    <>
      <div className={`kms-chat-stack${isOpen ? " open" : ""}`}>
        <section id="kmsChat" className="kms-chat" aria-label="KMS chat">
          <div className="kms-chat-head">
            <div>
              <div className="kms-chat-title">KMS Chat</div>
              <div className="subtle">Ask across KMS pages. Answers include citation links back to the matching page, document, or content chunk.</div>
            </div>
            <button type="button" className="kms-chat-close" aria-label="Close chat" onClick={() => setIsOpen(false)}>
              x
            </button>
          </div>
          <div className="kms-chat-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}${message.loading ? " loading" : ""}`}>
                <div>{message.text}</div>
                {message.citations?.length ? (
                  <div className="chat-citations">
                    {message.citations.map((doc) => (
                      <button key={`${doc.id}-${doc.chunkId}`} type="button" className="chat-citation" onClick={() => onOpenDoc(doc)}>
                        <strong>{citationLabel(doc)}</strong>
                        <span>{doc.summary}</span>
                        <span>{doc.citationLink || pagePathForDoc(doc)}</span>
                        <div className="chat-source-actions">
                          <span className="chat-source-chip">{doc.fileType}</span>
                          <span className="chat-source-chip">Updated {doc.updated}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form
            className="kms-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              const cleanQuestion = question.trim();
              if (!cleanQuestion) return;
              setQuestion("");
              submitChatQuestion(cleanQuestion);
            }}
          >
            <input placeholder="Ask a question in chat..." aria-label="Ask a KMS question" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <button type="submit">Ask</button>
          </form>
        </section>

        <section className="kms-chat-suggestions" aria-label="Suggested KMS questions">
          <div className="kms-suggestions-title">Try asking</div>
          <div className="kms-suggestion-list">
            {suggestedQuestions.map((suggestion) => (
              <button key={suggestion} type="button" className="kms-suggestion" onClick={() => submitChatQuestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      </div>

      <button type="button" className="kms-chat-launcher" aria-expanded={isOpen} aria-controls="kmsChat" onClick={() => setIsOpen((current) => !current)}>
        <span className="chat-launcher-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20a8 8 0 1 0-7.5-5.2" />
            <path d="M5 19.5 7.4 18.8" />
            <path d="M9 10.5h6" />
            <path d="M9 13.5h3.5" />
          </svg>
        </span>
        <span className="sr-only">Open KMS chat</span>
      </button>
    </>
  );
}
