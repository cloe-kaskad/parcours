import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client avec la clé service : contourne la RLS. Uniquement côté serveur,
// pour les tâches techniques (création de comptes, URLs signées, transcription).
export function createServiceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const cle = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  if (!url || !cle) {
    throw new Error("Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes dans Vercel.");
  }
  return createSupabaseClient(url, cle, { auth: { autoRefreshToken: false, persistSession: false } });
}
