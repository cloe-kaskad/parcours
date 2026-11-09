// Une parole de la cliente, en italique.
export function Citation({ children }: { children: React.ReactNode }) {
  return <blockquote className="font-italique text-[16px] italic leading-[1.6] text-violet">« {children} »</blockquote>;
}
