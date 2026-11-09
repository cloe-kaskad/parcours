export function EncadrePourquoi({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-l-[3px] border-rouge bg-beige px-[18px] py-4">
      <p className="font-titre text-[13px] font-semibold text-rouge">Pourquoi ça compte</p>
      <div className="text-[16px] leading-[1.55]">{children}</div>
    </div>
  );
}
