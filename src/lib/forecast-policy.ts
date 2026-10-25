export function weatherFallback<T>(
  baseline: T,
  weatherPrediction: T | null,
  available: boolean,
) {
  return !available || weatherPrediction === null
    ? {
        forecast: baseline,
        model: "naive",
        message: "Weather data unavailable; showing baseline forecast.",
      }
    : {
        forecast: baseline,
        model: "naive",
        message: "Weather is research context; showing baseline forecast.",
      };
}
