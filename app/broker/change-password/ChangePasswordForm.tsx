"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Mirrors the rule already enforced when an invited broker first sets their
// password in AcceptInviteForm, so the two paths cannot disagree about what
// counts as an acceptable password. Supabase enforces its own minimum server
// side as well; this check exists to fail fast with a clear message rather
// than to be the boundary.
const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // The BROWSER client — publishable (anon) key only, and the user's own
    // session. No service-role key is involved, and none could be: this is a
    // Client Component, and lib/supabase/admin.ts is guarded by `server-only`
    // so importing it here would fail the build rather than ship a secret.
    //
    // Supabase applies this to whoever the session belongs to; there is no
    // user id in the call, so this page cannot be pointed at another account.
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      // Supabase's own message is surfaced rather than a generic one. Unlike
      // the sign-in page — where a specific error would let someone probe
      // which email addresses exist — the caller here is already
      // authenticated as this account, so there is nothing to enumerate, and
      // the real reason ("should be different from the old password", "is
      // known to be weak") is what makes the failure actionable.
      //
      // The message describes the attempt; it never contains the password.
      setError(
        updateError.message ||
          "Could not update your password. Please try again."
      );
      setSubmitting(false);
      return;
    }

    // Cleared on success so the new password does not sit in component state
    // for the remainder of the page's life. It was never logged, never
    // persisted to storage, and never rendered — both inputs are
    // type="password" throughout.
    setPassword("");
    setConfirmPassword("");
    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div>
        <p className="font-serif text-xl text-brand-black mb-3">
          Password Updated
        </p>
        <p className="text-sm font-light text-brand-muted leading-relaxed">
          Your password has been changed. Use it the next time you sign in —
          this session stays active, so you do not need to sign in again now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* autoComplete="new-password" on both fields: it tells the browser and
          any password manager that this is a replacement credential, so
          neither offers to autofill the OLD password into them. */}
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New Password"
        className="input-light"
      />
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm New Password"
        className="input-light"
      />

      {error && <p className="text-xs text-red-700/80 font-light">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-gold-outline w-full">
        {submitting ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
