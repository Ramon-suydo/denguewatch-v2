export function calendarCorrelation(series: Map<string, number>, lag: number) {
  if (!Number.isInteger(lag) || lag < 1)
    throw Error("Use a positive calendar-week lag");
  const pairs = [...series].flatMap(([date, value]) => {
    const prior = new Date(Date.parse(date + "T00:00:00Z") - lag * 604800000)
      .toISOString()
      .slice(0, 10);
    return series.has(prior) ? [[value, series.get(prior)!]] : [];
  });
  if (pairs.length < 2) return { n: pairs.length, r: null };
  const mean = (values: number[]) =>
    values.reduce((a, b) => a + b, 0) / values.length;
  const a = mean(pairs.map((r) => r[0])),
    b = mean(pairs.map((r) => r[1]));
  const denominator = Math.sqrt(
    pairs.reduce((s, r) => s + (r[0] - a) ** 2, 0) *
      pairs.reduce((s, r) => s + (r[1] - b) ** 2, 0),
  );
  return {
    n: pairs.length,
    r: denominator
      ? pairs.reduce((s, r) => s + (r[0] - a) * (r[1] - b), 0) / denominator
      : null,
  };
}
