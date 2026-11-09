/** 1062 → "1.062 TL", 1062.5 → "1.062,50 TL" */
export function formatTL(value: number): string {
  return (
    value.toLocaleString('tr-TR', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }) + ' TL'
  );
}
