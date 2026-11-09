import { Bouton, Enveloppe, lienSite, Paragraphe } from "./commun";

// À Émilien, quand une séance est transcrite.
export function TranscriptPretEmilien({ prenom, numero, date, duree, seanceId }: { prenom: string; numero: number; date: string | null; duree: string | null; seanceId: string }) {
  return (
    <Enveloppe apercu={`${prenom}, séance ${numero} : le transcript est prêt`}>
      <Paragraphe>Émilien,</Paragraphe>
      <Paragraphe>
        La séance {numero} de <strong>{prenom}</strong>
        {date ? `, du ${date},` : ""} est transcrite.{duree ? ` L’audio dure ${duree}.` : ""} Tout est sur ta page, l’audio et le texte côte à côte, et la marge pour ton retour.
      </Paragraphe>
      <Bouton href={lienSite(`/emilien/seances/${seanceId}`)}>Lire et écouter</Bouton>
      <Paragraphe discret>Cloé sera prévenue quand tu auras envoyé ton retour.</Paragraphe>
    </Enveloppe>
  );
}
