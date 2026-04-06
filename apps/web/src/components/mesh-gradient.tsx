export function MeshGradient({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className || ''}`}>
      <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] animate-[spin_20s_linear_infinite]">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[oklch(0.65_0.25_280/0.3)] blur-[128px]" />
        <div className="absolute top-1/2 right-1/4 h-80 w-80 rounded-full bg-[oklch(0.68_0.22_220/0.25)] blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-[oklch(0.72_0.19_155/0.3)] blur-[128px]" />
      </div>
    </div>
  );
}
