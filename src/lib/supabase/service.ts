import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client avec la clé service : contourne la RLS. Uniquement côté serveur,
// pour les tâches techniques (création de comptes, URLs signées, transcription).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
