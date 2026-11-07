import Link from "next/link";
import { createClient, getProfil } from "@/lib/supabase/server";
import type { Parcours, Profile, Seance } from "@/lib/supabase/types";

type Ligne = { profil: Profile; parcours: Parcours | null; prochaine: Seance | null; derniere: Seance | null };

function formatDate(d: string | null) {
  if (!d) return "à définir";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

async function chargerLignes(): Promise<Ligne[]> {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "cliente")
    .eq("actif", true)
    .order("prenom")
    .returns<Profile[]>();

  const { data: parcoursList } = await supabase.from("parcours").select("*").eq("statut", "actif").returns<Parcours[]>();
  const { data: seances } = await supabase.from("seances").select("*").order("date", { ascending: true }).returns<Seance[]>();

  const maintenant = Date.now();
  return (clientes ?? []).map((c) => {
    const p = parcoursList?.find((x) => x.cliente_id === c.id) ?? null;
    const mes = p ? (seances ?? []).filter((s) => s.parcours_id === p.id) : [];
    const prochaine = mes.find((s) => s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) ?? null;
    const faites = mes.filter((s) => s.statut === "faite" && s.date);
    const derniere = faites.length ? faites[faites.length - 1] : null;
    return { profil: c, parcours: p, prochaine, derniere };
  });
}

export default async function TableauDeBord() {
  const profil = (await getProfil())!;
  const lignes = await chargerLignes();

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">Bonjour {profil.prenom || ""}.</h1>
        <p className="mt-2 text-base text-prune">
          {lignes.length} cliente{lignes.length > 1 ? "s" : ""} active{lignes.length > 1 ? "s" : ""}.
        </p>
      </section>

      <section className="bloc rounded-2xl bg-white/70 p-6">
        <h2 className="text-xl font-bold">Clientes</h2>
        {lignes.length === 0 ? (
          <p className="mt-3 text-base text-gris">Aucune cliente pour l’instant. Elles arriveront avec la migration.</p>
        ) : (
          <ul className="mt-4 divide-y divide-beige">
            {lignes.map(({ profil: c, parcours, prochaine, derniere }) => (
              <li key={c.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/coach/clientes/${c.id}`} className="text-lg font-semibold text-violet hover:text-rouge">
                    {c.prenom} {c.nom}
                  </Link>
                  <p className="text-sm text-gris">{parcours ? `Parcours depuis ${parcours.date_debut ?? "…"}` : "Pas de parcours actif"}</p>
                </div>
                <div className="text-sm text-encre">
                  <p>Prochaine séance : {formatDate(prochaine?.date ?? null)}</p>
                  <p className="text-gris">Dernière séance : {derniere ? formatDate(derniere.date) : "aucune"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
