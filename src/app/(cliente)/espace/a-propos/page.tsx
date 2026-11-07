import { Markdown } from "@/components/Markdown";
import { A_PROPOS } from "@/content/a-propos";

export const metadata = { title: "À propos" };

export default function APropos() {
  return (
    <div className="flex flex-col gap-8">
      <section className="bloc">
        <h1 className="text-[2.4rem] font-bold md:text-5xl">À propos de l’accompagnement</h1>
      </section>
      <section className="bloc carte p-5 md:p-8">
        <Markdown className="text-[1.05rem]">{A_PROPOS}</Markdown>
      </section>
    </div>
  );
}
