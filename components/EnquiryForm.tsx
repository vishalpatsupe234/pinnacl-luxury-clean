// components/EnquiryForm.tsx
"use client";

import React, { useState } from "react";

type Props = { propertyId: string; propertyTitle?: string };

export default function EnquiryForm({ propertyId, propertyTitle }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // optional: you can wire this to your API route /api/enquiry
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, name, phone, message: msg }),
      });
      setSent(true);
      setName(""); setPhone(""); setMsg("");
    } catch (err) {
      console.error(err);
      alert("Error sending. Check console.");
    } finally { setLoading(false); }
  }

  if (sent) {
    return <div className="p-4 rounded bg-green-50 text-green-800">Thanks — enquiry sent. We&apos;ll contact you soon.</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 rounded border" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 rounded border" />
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Message about ${propertyTitle || "property"}`} className="w-full px-3 py-2 rounded border" rows={3} />
      <button type="submit" disabled={loading} className="btn-primary-hero w-full text-center">
        {loading ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}
