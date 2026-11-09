import { Logo } from "./Logo";

// Le bandeau de l'ordinateur. Sur téléphone, le logo est dans la page et « Quitter » dans le pied.
export function Bandeau({ prenom }: { prenom: string }) {
  return (
    <div className="hidden h-14 items-center justify-between bg-violet-nuit px-10 text-creme md:flex">
      <Logo couleur="blanc" hauteur={42} />
      <div className="flex items-center gap-7">
        <span className="font-italique text-[15px] italic text-rose">{prenom}</span>
        <form action="/auth/deconnexion" method="post">
          <button type="submit" className="text-[13px] text-creme/70">
            Quitter
          </button>
        </form>
      </div>
    </div>
  );
}
