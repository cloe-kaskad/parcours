import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { EncadrePourquoi } from "./EncadrePourquoi";

const BASE: Components = {
  p: ({ children }) => <p className="t-lecture">{children}</p>,
  strong: ({ children }) => <strong className="font-titre font-semibold text-violet">{children}</strong>,
  em: ({ children }) => <em className="font-italique italic text-violet">{children}</em>,
  h1: ({ children }) => <h3 className="font-titre text-[20px] font-semibold leading-[1.1] text-violet">{children}</h3>,
  h2: ({ children }) => <h3 className="font-titre text-[20px] font-semibold leading-[1.1] text-violet">{children}</h3>,
  h3: ({ children }) => <h3 className="font-titre text-[20px] font-semibold leading-[1.1] text-violet">{children}</h3>,
  h4: ({ children }) => <h3 className="font-titre text-[20px] font-semibold leading-[1.1] text-violet">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-[18px] text-[16px] leading-[1.6] [&_li]:mb-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-[18px] text-[16px] leading-[1.6] [&_li]:mb-1.5">{children}</ol>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-rouge underline underline-offset-4">
      {children}
    </a>
  ),
  hr: () => <hr className="border-[var(--filet-papier-fort)]" />,
};

const AVEC_ENCADRES: Components = {
  ...BASE,
  blockquote: ({ children }) => <EncadrePourquoi>{children}</EncadrePourquoi>,
};

const SANS_ENCADRES: Components = {
  ...BASE,
  blockquote: ({ children }) => <blockquote className="border-l border-violet/30 pl-[22px]">{children}</blockquote>,
};

// Le texte d'une lettre ou d'une séance, avec la typographie de la lecture.
export function TexteLettre({ children, encadres = true }: { children: string; encadres?: boolean }) {
  return (
    <div className="flex flex-col gap-[18px] [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={encadres ? AVEC_ENCADRES : SANS_ENCADRES}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
