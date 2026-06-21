"use client";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

/** The user's username with inline edit (pencil → input → save). */
export function EditableUsername() {
  const { username, save } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function start() {
    setDraft(username);
    setError(null);
    setEditing(true);
  }

  // Username is required: must be 2–20 valid chars.
  const isValid = /^[a-zA-Z0-9_.-]{2,20}$/.test(draft.trim());

  async function commit() {
    if (!isValid) {
      setError("Username is required (2–20 chars: letters, numbers, _ . -)");
      return;
    }
    setSaving(true);
    const err = await save(draft.trim());
    setSaving(false);
    if (err) return setError(err);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{username}</h1>
        <button
          onClick={start}
          aria-label="Edit username"
          className="text-subtle hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={20}
          className="w-44 rounded-lg border border-line bg-canvas px-3 py-1.5 text-lg font-bold focus:border-brand focus:outline-none"
        />
        <button
          onClick={commit}
          disabled={saving || !isValid}
          aria-label="Save"
          className="text-up hover:opacity-80 disabled:opacity-40"
        >
          <Check className="size-5" />
        </button>
        <button onClick={() => setEditing(false)} aria-label="Cancel" className="text-muted hover:text-foreground">
          <X className="size-5" />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-down">{error}</p>}
    </div>
  );
}
