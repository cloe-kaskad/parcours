import Image from "next/image";
import { Barre, Colonne, PageCoach } from "@/components/coach/base";
import { FormAction } from "@/components/coach/interactifs";
import { Logo } from "@/components/espace/Logo";
import { creerCliente } from "@/lib/actions/clientes";
import { exigerEquipe } from "@/lib/auth";
import { BANQUE_COUVERTURES } from "@/lib/couvertures";

export const metadata = { title: "Une nouvelle cliente" };

export default async function NouvelleCliente() {
  await exigerEquipe();
  return (
    <PageCoach>
      <Barre retour={{ href: "/coach/clientes", libelle: "Clientes" }} droite={<Logo couleur="blanc" hauteur={30} />} />
      <Colonne className="pb-16 pt-[30px]">
        <h1 className="font-titre text-[38px] font-semibold leading-[0.95] tracking-[-0.03em] text-violet">Une nouvelle cliente</h1>
        <p className="pt-1.5 font-italique text-[14px] italic text-violet">Son espace existe dès que tu l’as créé. Le lien d’accès, tu l’envoies quand tu veux.</p>
        <div className="pt-[30px]">
          <FormAction action={creerCliente} bouton="Créer son espace" rouge className="gap-6">
            <div className="grid grid-cols-2 gap-[18px]">
              <label className="etiquette">
                prénom
                <input name="prenom" required className="champ" />
              </label>
              <label className="etiquette">
                nom
                <input name="nom" className="champ" />
              </label>
            </div>
            <label className="etiquette">
              email
              <input name="email" type="email" required className="champ" />
            </label>
            <label className="etiquette">
              l’intention du parcours, dans ta voix
              <textarea name="intention" className="champ-zone min-h-[120px]" />
            </label>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <label className="etiquette">
                dossier Drive à relier (lien ou identifiant)
                <input name="drive" className="champ" />
              </label>
              <label className="etiquette">
                son nom, pour t’y retrouver
                <input name="drive_nom" placeholder="B&I / Clientes / …" className="champ" />
              </label>
            </div>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="pb-2.5 text-[12px] text-violet">la couverture</legend>
              <div className="grid grid-cols-3 gap-2">
                {BANQUE_COUVERTURES.map((c, i) => (
                  <label key={c.chemin} className="choix-image">
                    <input type="radio" name="couverture" value={c.chemin} defaultChecked={i === 0} aria-label={c.nom} className="sr-only" />
                    <Image src={c.chemin} alt="" width={120} height={72} unoptimized className="h-[72px] w-full object-cover" />
                  </label>
                ))}
              </div>
              <p className="text-[12px] text-violet/70">Paysage, matière, lumière. Jamais de visage, jamais de photo « business ».</p>
            </fieldset>
          </FormAction>
          <p className="pt-3 font-italique text-[13px] italic text-violet/80">« Lui envoyer son lien d’accès » apparaîtra sur sa fiche, pour quand tu seras prête.</p>
        </div>
      </Colonne>
    </PageCoach>
  );
}
