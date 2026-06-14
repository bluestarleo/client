import React from "react";

export default function Footer() {
  return (
    <footer className="max-w-6xl w-full mx-auto mt-16 pt-8 border-t border-[var(--muted-border)] text-center text-sm text-[var(--muted)]">
      <p>© {new Date().getFullYear()} AI Travel Companion. All rights reserved.</p>
    </footer>
  );
}
