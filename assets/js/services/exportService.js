export const exportService = {
  exportToCsv(data, filename = 'export.csv') {
    // Prepare CSV blob and return it — UI modules handle the download
    const rows = data.map((item) => Object.values(item).join(','));
    const csv = [Object.keys(data[0] || {}).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    return { blob, filename };
  }
};
