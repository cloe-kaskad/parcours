import "server-only";
import { createServiceClient } from "./supabase/service";

// URL signée (1 h) pour lire un fichier d'un bucket privé. À n'appeler qu'après
// avoir vérifié que l'utilisatrice a le droit de voir ce fichier.
export async function urlSignee(bucket: string, chemin: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service.storage.from(bucket).createSignedUrl(chemin, 3600);
  return data?.signedUrl ?? null;
}
