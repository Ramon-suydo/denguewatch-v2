export const colors: {
  teal: Record<number, string>;
  signal: Record<number, string>;
  warm: Record<number, string>;
  risk: Record<
    "low" | "moderate" | "high" | "insufficient",
    { ink: string; surface: string; border: string }
  >;
  source: Record<
    "community" | "official",
    { ink: string; surface: string; border: string }
  >;
};
