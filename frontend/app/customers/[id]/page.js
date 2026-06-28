"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../lib/useAuth";
import { api } from "../../../lib/api";
import NavBar from "../../../components/NavBar";
import FloatingChat from "../../../components/FloatingChat";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading, logout } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [followUpContext, setFollowUpContext] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  function refresh() {
    api.getCustomer(id).then(setCustomer).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (user && id) {
      refresh();
      api.chatHistory(id).then(setChatMessages).catch(() => {});
    }
  }, [user, id]);

  async function handleSummary(e) {
    e.preventDefault();
    setSummaryLoading(true);
    setError("");
    try {
      await api.generateMeetingSummary({ customerId: id, rawNotes: notes });
      setNotes("");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleFollowUp(e) {
    e.preventDefault();
    setFollowUpLoading(true);
    setError("");
    try {
      await api.generateFollowUpEmail({ customerId: id, context: followUpContext });
      setFollowUpContext("");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleChatSend(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const userMsg = { role: "user", content: chatInput, id: `tmp-${Date.now()}` };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput("");
    try {
      const reply = await api.chat({ customerId: id, message: userMsg.content });
      setChatMessages((m) => [...m, reply]);
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadFile(id, file);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (authLoading || !user) return null;
  if (!customer) return <div className="p-8 text-sm text-slate-500">Loading...</div>;

  return (
    <div>
      <NavBar user={user} onLogout={logout} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-xl font-semibold text-slate-900">{customer.name}</h1>
        <p className="mb-6 text-sm text-slate-500">
          {customer.company} · {customer.status} · {customer.email || "no email"}
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Files */}
        <Section title="Files">
          <input type="file" onChange={handleUpload} disabled={uploading} className="mb-3 text-sm" />
          <ul className="space-y-1">
            {customer.files?.map((f) => (
              <li key={f.id} className="text-sm">
                <a
                  href={api.downloadFileUrl(f.id)}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {f.originalName}
                </a>
              </li>
            ))}
            {(!customer.files || customer.files.length === 0) && (
              <li className="text-sm text-slate-400">No files yet.</li>
            )}
          </ul>
        </Section>

        {/* Meeting summary */}
        <Section title="AI meeting summary">
          <form onSubmit={handleSummary} className="mb-3">
            <textarea
              placeholder="Paste raw meeting notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={3}
              className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={summaryLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {summaryLoading ? "Generating..." : "Generate summary"}
            </button>
          </form>
          <div className="space-y-3">
            {customer.meetingNotes?.map((m) => (
              <div key={m.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="text-slate-800">{m.summary}</p>
                {m.actionItems && <p className="mt-2 whitespace-pre-line text-slate-600">{m.actionItems}</p>}
              </div>
            ))}
          </div>
        </Section>

        {/* Follow-up email */}
        <Section title="AI follow-up email">
          <form onSubmit={handleFollowUp} className="mb-3">
            <textarea
              placeholder="What should the follow-up email be about?"
              value={followUpContext}
              onChange={(e) => setFollowUpContext(e.target.value)}
              required
              rows={2}
              className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={followUpLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {followUpLoading ? "Drafting..." : "Draft email"}
            </button>
          </form>
          <div className="space-y-3">
            {customer.followUps?.map((f) => (
              <div key={f.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{f.subject}</p>
                <p className="mt-1 whitespace-pre-line text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Chatbot */}
        <Section title="Ask the AI about this customer">
          <div
            ref={chatScrollRef}
            className="mb-3 flex h-72 flex-col space-y-2 overflow-y-auto rounded-md bg-slate-50 p-3"
          >
            {chatMessages.length === 0 && (
              <p className="text-sm text-slate-400">Ask anything about this customer.</p>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={
                    "inline-block max-w-[80%] rounded-md px-3 py-1.5 text-sm " +
                    (m.role === "user" ? "bg-slate-900 text-white" : "bg-white text-slate-800 shadow-sm")
                  }
                >
                  {m.content}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="text-left">
                <span className="inline-block rounded-md bg-white px-3 py-1.5 text-sm text-slate-400 shadow-sm">
                  Thinking...
                </span>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSend} className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a question..."
              disabled={chatLoading}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </Section>
      </main>
      <FloatingChat />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium text-slate-700">{title}</h2>
      {children}
    </section>
  );
}
