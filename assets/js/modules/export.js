export function exportToCSV(data) {
  const rows = data.map((item) => Object.values(item).join(','));
  const csv = [Object.keys(data[0] || {}).join(','), ...rows].join('
');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.csv';
  link.click();
}

export function exportToExcel(data) {
  console.warn('Export to Excel is not implemented yet.');
}

export function exportToPDF(data) {
  console.warn('Export to PDF is not implemented yet.');
}
