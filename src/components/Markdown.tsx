import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Rendu des textes écrits en Markdown (lettres de pratiques, transcripts, retours).
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div
      className={`prose-bi max-w-none text-base leading-relaxed [&_a]:text-rouge [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-rouge/40 [&_blockquote]:pl-4 [&_blockquote]:text-prune [&_em]:italique [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
