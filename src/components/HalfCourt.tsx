import { cn } from "@/lib/utils";

interface HalfCourtProps {
  onZoneClick: (zoneId: number) => void;
  bannedZone?: number | null;
}

export function HalfCourt({ onZoneClick, bannedZone }: HalfCourtProps) {
  
  const handlePathClick = (zoneId: number) => {
    if (bannedZone === zoneId) return;
    onZoneClick(zoneId);
  };

  const getStyle = (zoneId: number) => {
    const isBanned = bannedZone === zoneId;
    if (isBanned) {
      return "fill-zinc-400 stroke-black stroke-[1.5px] cursor-not-allowed opacity-60";
    }
    
    // Explicit color classes to bypass Tailwind JIT dynamic interpolation issues
    let fillClass = "fill-white";
    if (zoneId === 1) fillClass = "fill-[#a2b5f7]";
    if (zoneId === 2 || zoneId === 3) fillClass = "fill-[#f4a08e]";

    return cn(
      "cursor-pointer transition-all duration-200 stroke-black stroke-[1.5px]",
      "hover:brightness-90 filter", 
      fillClass
    );
  };

  return (
    <div className="w-full max-w-[500px] aspect-square relative bg-white overflow-hidden shadow-lg border-[3px] border-black isolate">
      <svg viewBox="0 0 400 400" className="w-full h-full block">
        
        {/* === CLICKABLE ZONES === */}
        {/* Zone 4 (Left Outside) */}
        <path d="M 0,0 L 40,0 L 40,80 A 160 160 0 0 0 140 228 L 100,400 L 0,400 Z" className={getStyle(4)} onClick={() => handlePathClick(4)} />
        
        {/* Zone 5 (Center Outside) */}
        <path d="M 100,400 L 140,228 A 160 160 0 0 0 260 228 L 300,400 Z" className={getStyle(5)} onClick={() => handlePathClick(5)} />
        
        {/* Zone 6 (Right Outside) */}
        <path d="M 400,0 L 360,0 L 360,80 A 160 160 0 0 1 260 228 L 300,400 L 400,400 Z" className={getStyle(6)} onClick={() => handlePathClick(6)} />

        {/* Zone 2 (Left Inside) */}
        <path d="M 40,0 L 40,80 A 160 160 0 0 0 200 240 L 200,170 L 140,170 L 140,0 Z" className={getStyle(2)} onClick={() => handlePathClick(2)} />
        
        {/* Zone 3 (Right Inside) */}
        <path d="M 260,0 L 260,170 L 200,170 L 200,240 A 160 160 0 0 0 360 80 L 360,0 Z" className={getStyle(3)} onClick={() => handlePathClick(3)} />
        
        {/* Zone 1 (Paint / Key) */}
        <path d="M 140,0 L 260,0 L 260,170 L 140,170 Z" className={getStyle(1)} onClick={() => handlePathClick(1)} />


        {/* === DECORATIVE COURT LINES === */}
        {/* Outer Court Border */}
        <rect x="0" y="0" width="400" height="400" className="fill-transparent stroke-black stroke-[3px] pointer-events-none" />

        {/* Paint / Key inner lines */}
        <rect x="165" y="0" width="70" height="170" className="fill-transparent stroke-black stroke-[1px] pointer-events-none opacity-40" />

        {/* Free Throw Top Semi-Circle (Dashed) */}
        <path d="M 140,170 A 60 60 0 0 1 260 170" className="fill-transparent stroke-black stroke-[1.5px] pointer-events-none stroke-dasharray-6" strokeDasharray="8 6" />
        
        {/* Free Throw Bottom Semi-Circle (Solid) */}
        <path d="M 140,170 A 60 60 0 0 0 260 170" className="fill-transparent stroke-black stroke-[1.5px] pointer-events-none" />

        {/* Backboard & Hoop */}
        <line x1="170" y1="35" x2="230" y2="35" className="stroke-black stroke-[3px] pointer-events-none" />
        <line x1="200" y1="35" x2="200" y2="45" className="stroke-black stroke-[2px] pointer-events-none" />
        <circle cx="200" cy="55" r="10" className="fill-transparent stroke-black stroke-[2px] pointer-events-none" />

        {/* Small Ticks on the 3 point line to match the image */}
        <line x1="0" y1="240" x2="20" y2="240" className="stroke-black stroke-[1.5px] pointer-events-none" />
        <line x1="380" y1="240" x2="400" y2="240" className="stroke-black stroke-[1.5px] pointer-events-none" />

        {/* Mid court semicircles at the bottom boundary */}
        <path d="M 140,400 A 60 60 0 0 1 260 400" className="fill-transparent stroke-black stroke-[1.5px] pointer-events-none" />
        <path d="M 180,400 A 20 20 0 0 1 220 400" className="fill-transparent stroke-black stroke-[1.5px] pointer-events-none" />


        {/* === TEXT LABELS === */}
        <text x="200" y="145" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">1</text>
        <text x="100" y="130" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">2</text>
        <text x="300" y="130" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">3</text>
        <text x="50" y="270" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">4</text>
        <text x="200" y="320" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">5</text>
        <text x="350" y="270" textAnchor="middle" className="text-[28px] pointer-events-none fill-black/80">6</text>

      </svg>
    </div>
  );
}

