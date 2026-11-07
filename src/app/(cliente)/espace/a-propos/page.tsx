import { Markdown } from "@/components/Markdown";
import { A_PROPOS } from "@/content/a-propos";

export const metadata = { title: "À propos" };

export default function APropos() {
  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-4xl font-bold">À propos de l’accompagnement</h1>
      </section>
      <section className="bloc rounded-2xl bg-white/70 p-6 md:p-8">
        <Markdown className="text-[1.05rem]">{A_PROPOS}</Markdown>
      </section>
    </div>
  );
}
