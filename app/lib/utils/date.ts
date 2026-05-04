export function formatDateRange(inicio: string, fim: string): string {
  const fmt = (d: string) => {
    const [, month, day] = d.split("-");
    return `${day}/${month}`;
  };
  return inicio === fim ? fmt(inicio) : `${fmt(inicio)} – ${fmt(fim)}`;
}

export function formatDay(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}
