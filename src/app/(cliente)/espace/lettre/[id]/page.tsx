import { redirect } from "next/navigation";

// Ancienne adresse des pratiques (« lettre ») : redirige vers /espace/pratiques/[id].
export default async function AncienneAdresse({ params }: PageProps<"/espace/lettre/[id]">) {
  const { id } = await params;
  redirect(`/espace/pratiques/${id}`);
}
