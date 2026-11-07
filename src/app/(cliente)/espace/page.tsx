import { createClient, getProfil } from "@/lib/supabase/server";
import type { Parcours, PratiquesSerie, Seance } from "@/lib/supabase/types";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(
    new Date(d),
  );
}

export default async function EspaceAccueil() {
  const profil = (await getProfil())!;
  const supabase = await createClient();

  const { data: parcours } = await supabase
    .from("parcours")
    .select("*")
    .eq("cliente_id", profil.id)
    .eq("statut", "actif")
    .maybeSingle<Parcours>();

  let prochaine: Seance | null = null;
  let serie: PratiquesSerie | null = null;

  if (parcours) {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase
        .from("seances")
        .select("*")
        .eq("parcours_id", parcours.id)
        .eq("statut", "planifiee")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle<Seance>(),
      supabase
        .from("pratiques_series")
        .select("*")
        .eq("parcours_id", parcours.id)
        .not("publiee_at", "is", null)
        .order("publiee_at", { ascending: false })
        .limit(1)
        .maybeSingle<PratiquesSerie>(),
    ]);
    prochaine = s;
    serie = p;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Bonjour {profil.prenom || ""}.</h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-prune">
          Cet espace est le tien. Il garde une trace de notre travail, clarifie les prochaines étapes et accueille ce
          qui émerge entre les séances.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bloc rounded-2xl bg-white/70 p-6">
          <h2 className="text-xl font-bold">Prochaine séance</h2>
          <p className="mt-2 text-base">
            {prochaine?.date ? formatDate(prochaine.date) : "Pas encore de date. Cloé te la proposera bientôt."}
          </p>
        </section>

        <section className="bloc rounded-2xl bg-white/70 p-6">
          <h2 className="text-xl font-bold">Pratiques en cours</h2>
          <p className="mt-2 text-base">
            {serie ? (
              <>
                {serie.titre || "Ta dernière série de pratiques"}.{" "}
                <a href="/espace/pratiques" className="font-medium text-rouge underline-offset-4 hover:underline">
                  Les ouvrir
                </a>
              </>
            ) : (
              "Rien pour l’instant. Les pratiques arrivent après chaque séance."
            )}
          </p>
        </section>
      </div>

      {parcours?.intention ? (
        <section className="bloc rounded-2xl bg-beige/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-rouge">Ce parcours</h2>
          <p className="mt-2 text-lg leading-relaxed text-violet">{parcours.intention}</p>
        </section>
      ) : null}
    </div>
  );
}
