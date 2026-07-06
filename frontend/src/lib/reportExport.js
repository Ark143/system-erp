const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function buildPdfHtml(label, columns, rows) {
  const rowsHtml = rows
    .slice(0, 5000)
    .map(
      (r) => `
    <tr>
      ${columns
        .map(
          (c) => `<td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#0f172a">${escapeHtml(String(r[c.key] ?? ''))}</td>`
        )
        .join('')}
    </tr>
  `
    )
    .join('');

  const columnsHtml = columns
    .map((c) => `<th style="padding:10px;border-bottom:1px solid #cbd5e1;font-size:12px;color:#334155;text-transform: uppercase; letter-spacing: 0.05em; text-align:left;background:#f8fafc">${escapeHtml(String(c.label || c.key))}</th>`)
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif; color: #0f172a; padding: 24px; }
  .page { max-width: 1100px; margin: 0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
  .title { font-size: 20px; font-weight: 800; }
  .meta { font-size: 12px; color:#6b7280; }
  .actions { display:flex; gap:8px; margin: 10px 0; }
  button { background:#111827; color:#fff; border:0; padding:10px 12px; border-radius:10px; font-size:12px; cursor:pointer; }
  .grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .grid th { background:#f8fafc; text-align:left; padding:10px; border-bottom:1px solid #cbd5e1; font-size:12px; color:#334155; text-transform: uppercase; letter-spacing: 0.05em; }
  .grid td { font-size: 12px; }
  .footer { margin-top: 18px; font-size: 12px; color:#94a3b8; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    .grid { font-size: 11px; }
    .page { max-width: 100%; padding: 0; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">${escapeHtml(label)}</div>
        <div class="meta">Generated ${new Date().toLocaleString()}</div>
      </div>
    </div>
    <div class="section no-print">
      <div class="actions">
        <button onclick="window.print()">Print / Save as PDF</button>
      </div>
    </div>
    <table class="grid">
      <thead><tr>${columnsHtml}</tr></thead>
      <tbody>${rowsHtml || `<tr><td style="padding:12px;color:#94a3b8">No records</td></tr>`}</tbody>
    </table>
    <div class="footer">System ERP • Printed ${new Date().toLocaleString()}</div>
  </div>
</body>
</html>`;
}

function buildCsvBlob(rows, columns) {
  const header = columns.map((c) => String(c.label || c.key).replace(/"/g, '""')).join(',');
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          let val = r[c.key];
          if (val === undefined || val === null) val = '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    )
    .join('\n');
  return new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useExport(label, columns, rows, filenamePrefix) {
  const exportCsv = () => {
    const blob = buildCsvBlob(rows, columns);
    downloadBlob(blob, `${filenamePrefix || 'report'}.csv`);
  };

  const exportPdf = () => {
    const html = buildPdfHtml(label, columns, rows);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    let opened = false;
    try {
      const win = window.open(url, '_blank', 'width=1200,height=800,noopener,noreferrer');
      opened = Boolean(win);
      if (!opened) fallbackDownloadHtml(label, html);
    } catch {
      fallbackDownloadHtml(label, html);
    }
  };

  return { exportCsv, exportPdf };
}

function fallbackDownloadHtml(label, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `${label.replace(/\s+/g, '_').toLowerCase()}.html`);
}
