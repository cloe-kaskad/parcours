import Link from "next/link";
import { Carte, LienBouton, Pastille, Vide } from "@/components/ui";
import { dateHeure, joursDepuis } from "@/lib/dates";
import { createClient, getProfil } from "@/lib/supabase/server";
import type { Parcours, PratiquesSerie, Profile, Seance } from "@/lib/supabase/types";

type Ligne = { profil: Profile; parcours: Parcours | null; prochaine: Seance | null; derniere: Seance | null };
type Alerte = { cliente: Profile; seance: Seance; texte: string; niveau: "alerte" | "neutre" };

async function charger() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: parcoursList }, { data: seances }, { data: series }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "cliente").eq("actif", true).order("prenom").returns<Profile[]>(),
    supabase.from("parcours").select("*").eq("statut", "actif").returns<Parcours[]>(),
    supabase.from("seances").select("*").order("date", { ascending: true }).returns<Seance[]>(),
    supabase.from("pratiques_series").select("*").returns<PratiquesSerie[]>(),
  ]);

  const maintenant = Date.now();
  const lignes: Ligne[] = [];
  const alertes: Alerte[] = [];
  const agenda: { cliente: Profile; seance: Seance }[] = [];

  for (const c of clientes ?? []) {
    const p = parcoursList?.find((x) => x.cliente_id === c.id) ?? null;
    const mes = p ? (seances ?? []).filter((s) => s.parcours_id === p.id) : [];
    const prochaine = mes.find((s) => s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) ?? null;
    const faites = mes.filter((s) => s.statut === "faite" && s.date);
    const derniere = faites.length ? faites[faites.length - 1] : null;
    lignes.push({ profil: c, parcours: p, prochaine, derniere });

    for (const s of mes) {
      if (s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) agenda.push({ cliente: c, seance: s });
      if (s.statut !== "faite") continue;
      const j = joursDepuis(s.date) ?? 0;
      const pratiquesPubliees = (series ?? []).some((x) => x.seance_id === s.id && x.publiee_at);
      if (s.transcript_statut !== "pret" && j >= 1) alertes.push({ cliente: c, seance: s, texte: `transcript manquant (J+${j})`, niveau: "alerte" });
      if (s.transcript_statut === "pret" && !s.envoye_emilien_at) alertes.push({ cliente: c, seance: s, texte: "transcript prêt, pas transmis à Émilien", niveau: "neutre" });
      if (!pratiquesPubliees && j >= 7) alertes.push({ cliente: c, seance: s, texte: `pratiques non publiées (J+${j})`, niveau: "alerte" });
      else if (!pratiquesPubliees && j >= 4) alertes.push({ cliente: c, seance: s, texte: `pratiques à publier avant J+7 (J+${j})`, niveau: "neutre" });
    }
  }
  agenda.sort((a, b) => new Date(a.seance.date!).getTime() - new Date(b.seance.date!).getTime());
  return { lignes, alertes, agenda: agenda.slice(0, 8) };
}

export default async function TableauDeBord() {
  const profil = (await getProfil())!;
  const { lignes, alertes, agenda } = await charger();

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Bonjour {profil.prenom || ""}.</h1>
          <p className="mt-2 text-base text-prune">
            {lignes.length} cliente{lignes.length > 1 ? "s" : ""} active{lignes.length > 1 ? "s" : ""}.
          </p>
        </div>
        <LienBouton href="/coach/clientes" variante="primaire">
          Nouvelle cliente
        </LienBouton>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="À faire" action={alertes.length ? <Pastille ton="alerte">{alertes.length}</Pastille> : <Pastille ton="ok">rien</Pastille>}>
          {!alertes.length ? (
            <Vide>Tout est à jour.</Vide>
          ) : (
            <ul className="divide-y divide-beige">
              {alertes.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <Link href={`/coach/clientes/${a.cliente.id}/seances/${a.seance.id}`} className="font-semibold text-violet hover:text-rouge">
                      {a.cliente.prenom}, séance {a.seance.numero}
                    </Link>{" "}
                    : {a.texte}
                  </span>
                  <Pastille ton={a.niveau}>{a.niveau === "alerte" ? "en retard" : "bientôt"}</Pastille>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Prochaines séances">
          {!agenda.length ? (
            <Vide>Aucune séance planifiée.</Vide>
          ) : (
            <ul className="divide-y divide-beige">
              {agenda.map(({ cliente, seance }) => (
                <li key={seance.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/coach/clientes/${cliente.id}/seances/${seance.id}`} className="font-semibold text-violet hover:text-rouge">
                    {cliente.prenom}, séance {seance.numero}
                  </Link>
                  <span className="text-gris">{dateHeure(seance.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <Carte titre="Clientes">
        {lignes.length === 0 ? (
          <Vide>Aucune cliente pour l’instant.</Vide>
        ) : (
          <ul className="divide-y divide-beige">
            {lignes.map(({ profil: c, parcours, prochaine, derniere }) => (
              <li key={c.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/coach/clientes/${c.id}`} className="text-lg font-semibold text-violet hover:text-rouge">
                    {c.prenom} {c.nom}
                  </Link>
                  <p className="text-sm text-gris">{parcours ? `Parcours depuis ${parcours.date_debut ?? "…"}` : "Pas de parcours actif"}</p>
                </div>
                <div className="text-sm text-encre">
                  <p>Prochaine séance : {dateHeure(prochaine?.date)}</p>
                  <p className="text-gris">Dernière séance : {derniere ? dateHeure(derniere.date) : "aucune"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
