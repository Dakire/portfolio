// Téléchargement d'un contenu généré dans le navigateur (aucun envoi réseau).
export function downloadBlob(filename, data, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const formatBytes = (bytes, unit = 'KB') => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} M${unit.replace('K', '')}` : `${Math.max(1, Math.round(bytes / 1024))} ${unit}`);
