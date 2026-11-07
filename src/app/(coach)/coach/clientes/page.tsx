import Link from "next/link";
import { Formulaire } from "@/components/Formulaire";
import { Carte, Champ, Pastille, Vide, Zone } from "@/components/ui";
import { creerCliente } from "@/lib/actions/clientes";
import { createClient } from "@/lib/supabase/server";
import type { Parcours, Profile } from "@/lib/supabase/types";

export const metadata = { title: "Clientes" };

export default async function Clientes() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: parcours }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "cliente").order("prenom").returns<Profile[]>(),
    supabase.from("parcours").select("*").returns<Parcours[]>(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold md:text-5xl">Clientes</h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Carte titre="Toutes les clientes">
          {!clientes?.length ? (
            <Vide>Aucune cliente pour l’instant.</Vide>
          ) : (
            <ul className="divide-y divide-ligne">
              {clientes.map((c) => {
                const p = parcours?.find((x) => x.cliente_id === c.id);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <Link href={`/coach/clientes/${c.id}`} className="text-lg font-semibold text-violet hover:text-rouge">
                        {c.prenom} {c.nom}
                      </Link>
                      <p className="text-sm text-gris">{c.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {!c.actif ? <Pastille>archivée</Pastille> : null}
                      {p ? (
                        <Pastille ton={p.statut === "actif" ? "ok" : "neutre"}>{p.statut}</Pastille>
                      ) : (
                        <Pastille ton="alerte">sans parcours</Pastille>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>

        <Carte titre="Nouvelle cliente">
          <Formulaire action={creerCliente} bouton="Créer son espace">
            <Champ label="Prénom" name="prenom" required autoComplete="off" />
            <Champ label="Nom" name="nom" autoComplete="off" />
            <Champ label="Email" name="email" type="email" required aide="C’est avec cette adresse qu’elle se connectera." />
            <Champ label="Début du parcours" name="date_debut" type="date" />
            <Zone label="Intention du parcours" name="intention" placeholder="Ce parcours a été pensé pour t’aider à passer de … à …" />
          </Formulaire>
          <p className="mt-3 text-xs text-gris">
            Son espace est créé tout de suite. Tu lui envoies son lien d’accès depuis sa fiche quand tu es prête.
          </p>
        </Carte>
      </div>
    </div>
  );
}
