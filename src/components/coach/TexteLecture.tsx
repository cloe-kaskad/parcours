import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Le composant de lecture des textes longs de l'espace équipe : DM Sans droit, 17 px,
// interligne 1.65, encre sur papier, colonne de 62 à 68 caractères, paragraphes séparés d'un vrai blanc.
// Aucun italique pour le texte courant.
const COMPOSANTS: Components = {
  p: ({ children }) => <p className="m-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="m-0 pt-1 font-titre text-[20px] font-semibold leading-[1.15] text-violet">{children}</h3>,
  h2: ({ children }) => <h3 className="m-0 pt-1 font-titre text-[20px] font-semibold leading-[1.15] text-violet">{children}</h3>,
  h3: ({ children }) => <h4 className="m-0 pt-1 font-titre text-[18px] font-semibold leading-[1.2] text-violet">{children}</h4>,
  h4: ({ children }) => <h4 className="m-0 pt-1 font-titre text-[18px] font-semibold leading-[1.2] text-violet">{children}</h4>,
  ul: ({ children }) => <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[22px]">{children}</ul>,
  ol: ({ children }) => <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-[22px]">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="m-0 flex flex-col gap-[1em] border-l-[3px] border-rose pl-4 text-encre/85">{children}</blockquote>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-rouge underline underline-offset-4">
      {children}
    </a>
  ),
  hr: () => <hr className="my-1 w-16 border-[var(--filet-papier-fort)]" />,
};

export function TexteLecture({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`lecture flex max-w-[66ch] flex-col gap-[1.05em] text-[17px] leading-[1.65] text-encre [overflow-wrap:anywhere] ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPOSANTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
