import { useNavigate } from 'react-router-dom';

export default function PurchasingListShell({ title, subtitle, createLabel, createTo, columns, rows, onRowClick, renderActions, error, onRetry }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">{subtitle}</p>}
        </div>
        <button onClick={() => navigate(createTo)} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">{createLabel}</button>
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead>
            <tr className="bg-black/[0.01]">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">{col.label}</th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-[var(--color-muted)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-[var(--color-ink)]">{col.value ? col.value(r) : r[col.key]}</td>
                ))}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onRowClick(r)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">View</button>
                    {renderActions ? renderActions(r) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!!onRetry && error && (
        <div className="flex justify-end">
          <button onClick={onRetry} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">Retry</button>
        </div>
      )}
    </div>
  );
}
