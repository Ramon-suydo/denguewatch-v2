import { getSupabase } from "./supabase";
import { requireOnlineMutation } from "./demo-snapshot";
export const SIGNAL_VERSION = "community-v2";
export function scrubNote(value: string): string {
  if (
    /street|road|avenue|apartment|house|purok|sitio|address|brgy|barangay|unit\s+\d/i.test(
      value,
    )
  )
    return "";
  return value
    .replace(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      "[email removed]",
    )
    .replace(/\+?[0-9][0-9 ()-]{6,}[0-9]/g, "[phone removed]")
    .replace(/<[^>]*>/g, "")
    .trim();
}
export async function signalPolicy(signal: AbortSignal) {
  if (!navigator.onLine) return { enabled: false, verified: false };
  try {
    const { data, error } = await getSupabase()
      .from("reporting_v2_policy")
      .select("enabled,consent_version")
      .eq("id", true)
      .abortSignal(signal)
      .single();
    return {
      enabled:
        !error &&
        data?.enabled === true &&
        data.consent_version === SIGNAL_VERSION,
      verified: !error,
    };
  } catch {
    return { enabled: false, verified: false };
  }
}
export async function proof(
  challenge: { challenge_id: string; salt: string; difficulty: number },
  signal: AbortSignal,
) {
  if (
    challenge.difficulty !== 16 ||
    !/^[a-f0-9-]{36}$/.test(challenge.challenge_id) ||
    !/^[a-f0-9]{32}$/.test(challenge.salt)
  )
    throw Error("Unsupported submission challenge.");
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 2000000; nonce++) {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(`${challenge.challenge_id}:${challenge.salt}:${nonce}`),
      ),
    );
    if (digest[0] === 0 && digest[1] === 0) return String(nonce);
  }
  throw Error("The anti-spam check timed out. Try again later.");
}
export async function submitSignal(
  input: {
    barangay: string;
    onset: string;
    symptoms: string[];
    note: string;
    consent: boolean;
    honeypot: string;
  },
  signal: AbortSignal,
) {
  requireOnlineMutation();
  const { data: challenges, error: challengeError } =
    await getSupabase().rpc("report_challenge");
  if (challengeError || !challenges?.[0])
    throw Error(
      "Reporting is closed or temporarily unavailable. No submission was sent.",
    );
  const challenge = challenges[0],
    nonce = await proof(challenge, signal);
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const { data, error } = await getSupabase().rpc("submit_signal", {
    p_challenge: challenge.challenge_id,
    p_nonce: nonce,
    p_barangay: input.barangay || null,
    p_onset: input.onset,
    p_symptoms: input.symptoms,
    p_note: scrubNote(input.note) || null,
    p_consent: input.consent,
    p_version: SIGNAL_VERSION,
    p_honeypot: input.honeypot,
  });
  if (error || typeof data !== "string" || !/^DW2-[A-F0-9]{32}$/.test(data))
    throw Error(
      "We could not confirm whether this report was saved. Do not submit again automatically; contact the research team for help.",
    );
  return data;
}
export async function withdrawSignal(code: string) {
  requireOnlineMutation();
  const { error } = await getSupabase().rpc("withdraw_signal", {
    p_code: code.trim().toUpperCase(),
  });
  if (error)
    throw Error(
      "Withdrawal is unavailable. You may safely retry with the same code.",
    );
}
export type SignalAggregate = {
  area_label: string;
  week_start: string;
  report_count: number;
};
export async function signalAggregates(
  signal: AbortSignal,
): Promise<SignalAggregate[]> {
  if (!navigator.onLine)
    throw Error(
      "Community reports are unavailable offline; no counts are inferred.",
    );
  const { data, error } = await getSupabase()
    .rpc("community_signal_aggregates")
    .abortSignal(signal);
  if (error)
    throw Error(
      "Community aggregates are unavailable; no counts are inferred. Check reporting status separately.",
    );
  return (data ?? []).map((r: SignalAggregate) => {
    if (
      !r.area_label ||
      !r.week_start ||
      !Number.isSafeInteger(Number(r.report_count)) ||
      Number(r.report_count) < 3
    )
      throw Error("Community aggregate failed privacy validation.");
    return { ...r, report_count: Number(r.report_count) };
  });
}
