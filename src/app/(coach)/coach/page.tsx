import Link from "next/link";
import { Carte, LienBouton, Ligne, Pastille, Vide } from "@/components/ui";
import { avantOuverture, dateHeure, joursDepuis } from "@/lib/dates";
import { createClient, getProfil } from "@/lib/supabase/server";
import type { Parcours, PratiquesSerie, Profile, Seance } from "@/lib/supabase/types";

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
  const alertes: Alerte[] = [];
  const agenda: { cliente: Profile; seance: Seance }[] = [];
  const cartes = (clientes ?? []).map((c) => {
    const p = parcoursList?.find((x) => x.cliente_id === c.id) ?? null;
    const mes = p ? (seances ?? []).filter((s) => s.parcours_id === p.id) : [];
    const prochaine = mes.find((s) => s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) ?? null;
    const faites = mes.filter((s) => s.statut === "faite");
    for (const s of mes) {
      if (s.statut === "planifiee" && s.date && new Date(s.date).getTime() >= maintenant) agenda.push({ cliente: c, seance: s });
      if (s.statut !== "faite" || avantOuverture(s.date)) continue;
      const j = joursDepuis(s.date) ?? 0;
      const publiees = (series ?? []).some((x) => x.seance_id === s.id && x.publiee_at);
      if (s.transcript_statut !== "pret" && j >= 1) alertes.push({ cliente: c, seance: s, texte: `transcript à déposer (J+${j})`, niveau: "alerte" });
      if (s.transcript_statut === "pret" && !s.envoye_emilien_at) alertes.push({ cliente: c, seance: s, texte: "transcript prêt, à transmettre à Émilien", niveau: "neutre" });
      if (!publiees && j >= 7) alertes.push({ cliente: c, seance: s, texte: `exercices en retard (J+${j})`, niveau: "alerte" });
      else if (!publiees && j >= 4) alertes.push({ cliente: c, seance: s, texte: `exercices à envoyer avant J+7 (J+${j})`, niveau: "neutre" });
    }
    return { profil: c, parcours: p, prochaine, nbFaites: faites.length };
  });
  agenda.sort((a, b) => new Date(a.seance.date!).getTime() - new Date(b.seance.date!).getTime());
  return { cartes, alertes, agenda: agenda.slice(0, 6) };
}

export default async function TableauDeBord() {
  const profil = (await getProfil())!;
  const { cartes, alertes, agenda } = await charger();

  return (
    <div className="flex flex-col gap-6">
      <section className="bloc flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">Bonjour {profil.prenom}.</h1>
          <p className="mt-2 text-base text-gris">
            {alertes.length === 0 ? "Rien en retard." : `${alertes.length} chose${alertes.length > 1 ? "s" : ""} à faire.`}
          </p>
        </div>
        <LienBouton href="/coach/clientes" variante="secondaire">
          Les clientes
        </LienBouton>
      </section>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Carte titre="À faire">
          {!alertes.length ? (
            <Vide>Tout est à jour. Les rappels apparaissent ici : transcript à J+1, exercices à J+7.</Vide>
          ) : (
            <ul>
              {alertes.map((a, i) => (
                <Ligne key={i} href={`/coach/clientes/${a.cliente.id}/seances/${a.seance.id}`} aside={<Pastille ton={a.niveau}>{a.niveau === "alerte" ? "en retard" : "bientôt"}</Pastille>}>
                  <p className="font-semibold text-violet">
                    {a.cliente.prenom}, séance {a.seance.numero}
                  </p>
                  <p className="text-sm text-gris">{a.texte}</p>
                </Ligne>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Prochaines séances">
          {!agenda.length ? (
            <Vide>Aucune séance planifiée.</Vide>
          ) : (
            <ul>
              {agenda.map(({ cliente, seance }) => (
                <Ligne key={seance.id} href={`/coach/clientes/${cliente.id}/seances/${seance.id}`}>
                  <p className="font-semibold text-violet">
                    {cliente.prenom}, séance {seance.numero}
                  </p>
                  <p className="text-sm text-gris">{dateHeure(seance.date)}</p>
                </Ligne>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <section className="bloc">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Clientes</h2>
          <Link href="/coach/clientes" className="text-sm font-semibold text-rouge underline-offset-4 hover:underline">
            Ajouter une cliente
          </Link>
        </div>
        {!cartes.length ? (
          <div className="carte p-6">
            <Vide>Aucune cliente active. Crée la première depuis « Clientes ».</Vide>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cartes.map(({ profil: c, parcours, prochaine, nbFaites }) => (
              <li key={c.id}>
                <Link href={`/coach/clientes/${c.id}`} className="carte block h-full p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(89,17,77,0.5)]">
                  <h3 className="text-2xl font-bold">{c.prenom}</h3>
                  <p className="text-sm text-gris">{c.nom}</p>
                  <dl className="mt-4 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gris">Prochaine</dt>
                      <dd className="text-right">{prochaine ? dateHeure(prochaine.date) : "à planifier"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gris">Séances faites</dt>
                      <dd>{nbFaites}</dd>
                    </div>
                  </dl>
                  {!parcours ? (
                    <p className="mt-3">
                      <Pastille ton="alerte">sans parcours</Pastille>
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
