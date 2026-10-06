import { useState } from "react";
import { listLink } from "../route.js";

// Copies a list's link, ready to paste into an email or message.
export default function CopyLinkButton({ id }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = listLink(id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button className="chip" onClick={copy} aria-live="polite">
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
