import { Fragment } from 'react';

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">{title}</h3>
          <button onClick={onClose} className="font-semibold text-[var(--color-ink-secondary)] hover:underline">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
