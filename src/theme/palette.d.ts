export const colors: {
  navy: Record<number, string>;
  gold: Record<number, string>;
  neutral: Record<number, string>;
  cobalt: { 500: string; bright: string };
  pop: { cyan: string; coral: string; amber: string };
  paper: string; ink: string; density: string[];
  risk: Record<
    "low" | "moderate" | "high" | "insufficient",
    { ink: string; surface: string; border: string }
  >;
  source: Record<
    "community" | "official",
    { ink: string; surface: string; border: string }
  >;
};
