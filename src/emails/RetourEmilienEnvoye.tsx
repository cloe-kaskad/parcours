import { Bouton, Enveloppe, lienSite, Paragraphe } from "./commun";

// À Cloé, quand Émilien envoie son retour.
export function RetourEmilienEnvoye({ prenom, numero, clienteId, seanceId }: { prenom: string; numero: number; clienteId: string; seanceId: string }) {
  return (
    <Enveloppe apercu={`${prenom}, séance ${numero} : le retour d’Émilien est là`}>
      <Paragraphe>Cloé,</Paragraphe>
      <Paragraphe>
        Émilien a envoyé son retour sur la séance {numero} de <strong>{prenom}</strong>. Il t’attend sur la page de la séance.
      </Paragraphe>
      <Bouton href={lienSite(`/coach/clientes/${clienteId}/seances/${seanceId}`)}>Lire son retour</Bouton>
    </Enveloppe>
  );
}
