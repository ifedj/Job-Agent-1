"use client";

import { useState, useEffect } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
  source: string;
  linkedinUrl: string | null;
  outreachs: Array<{
    id: string;
    emailSubject: string;
    emailBody: string;
    status: string;
    sentAt: string | null;
  }>;
};

export function OutreachSection({ applicationId }: { applicationId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadContacts() {
    const res = await fetch(`/api/applications/${applicationId}/contacts`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
  }

  useEffect(() => {
    setLoading(true);
    loadContacts().finally(() => setLoading(false));
  }, [applicationId]);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), linkedinUrl: linkedinUrl.trim() || undefined }),
      });
      if (res.ok) {
        setName("");
        setEmail("");
        setLinkedinUrl("");
        await loadContacts();
      }
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="mt-8 text-sm text-slate-500">Loading contacts…</div>;

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <h2 className="text-lg font-medium text-slate-900">Hiring manager / outreach</h2>
      <p className="mt-1 text-sm text-slate-500">
        Add a contact (e.g. hiring manager or CEO). Generate an outreach email, edit and approve, then send or copy.
      </p>

      <form onSubmit={addContact} className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="url"
          placeholder="LinkedIn URL (optional)"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add contact"}
        </button>
      </form>

      <ul className="mt-6 space-y-4">
        {contacts.map((c) => (
          <li key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-600">{c.email}</p>
                {c.linkedinUrl && (
                  <a
                    href={c.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            <OutreachList contactId={c.id} outreachs={c.outreachs} onSent={loadContacts} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OutreachList({
  contactId,
  outreachs,
  onSent,
}: {
  contactId: string;
  outreachs: Contact["outreachs"];
  onSent: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function generateOutreach() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/outreach`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.outreach) {
        setEditingId(data.outreach.id);
        onSent();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-3">
      {outreachs.length === 0 ? (
        <button
          type="button"
          onClick={generateOutreach}
          disabled={generating}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate outreach email"}
        </button>
      ) : (
        outreachs.map((o) => (
          <OutreachRow
            key={o.id}
            outreach={o}
            isEditing={editingId === o.id}
            onEdit={() => setEditingId(o.id)}
            onSent={onSent}
          />
        ))
      )}
    </div>
  );
}

function OutreachRow({
  outreach,
  isEditing,
  onEdit,
  onSent,
}: {
  outreach: { id: string; emailSubject: string; emailBody: string; status: string; sentAt: string | null };
  isEditing: boolean;
  onEdit: () => void;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState(outreach.emailSubject);
  const [body, setBody] = useState(outreach.emailBody);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/outreach/${outreach.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSubject: subject, emailBody: body, status: "approved" }),
      });
      onSent();
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    setSending(true);
    setCopyMessage("");
    try {
      const res = await fetch(`/api/outreach/${outreach.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        onSent();
      } else if (data.copied && data.email) {
        const text = `To: ${data.email.to}\nSubject: ${data.email.subject}\n\n${data.email.body}`;
        await navigator.clipboard.writeText(text);
        setCopyMessage("Copied to clipboard (email not sent – configure RESEND_API_KEY to send).");
      }
    } finally {
      setSending(false);
    }
  }

  if (outreach.status === "sent") {
    return (
      <div className="rounded bg-green-50 p-3 text-sm text-green-800">
        Sent {outreach.sentAt ? new Date(outreach.sentAt).toLocaleString() : ""}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
      {isEditing ? (
        <>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded border border-slate-300 p-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Save & approve
            </button>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium text-slate-700">{outreach.emailSubject}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{outreach.emailBody.slice(0, 200)}…</p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 text-sm font-medium text-slate-900 hover:underline"
          >
            Edit & send
          </button>
        </div>
      )}
      {copyMessage && <p className="mt-2 text-sm text-slate-600">{copyMessage}</p>}
    </div>
  );
}
