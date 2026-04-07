import { cn } from "@/lib/utils";

interface HalfCourtProps {
  onZoneClick: (zoneId: number) => void;
  bannedZone?: number | null;
}

export function HalfCourt({ onZoneClick, bannedZone }: HalfCourtProps) {
  // A simple 6-zone SVG visualization of a half court
  // Zones 1,2,3 are inside the arch (2-pointers)
  // Zones 4,5,6 are outside the arch (3-pointers)
  
  const handlePathClick = (zoneId: number) => {
    if (bannedZone === zoneId) return;
    onZoneClick(zoneId);
  };

  const getStyle = (zoneId: number) => {
    const isBanned = bannedZone === zoneId;
    return cn(
      "cursor-pointer transition-colors duration-200 stroke-border stroke-2",
      isBanned ? "fill-muted stroke-muted cursor-not-allowed opacity-50" : "fill-background hover:fill-primary/20"
    );
  };

  return (
    <div className="w-full max-w-[500px] aspect-[5/4] border-2 border-foreground relative bg-card rounded-b-lg overflow-hidden flex shadow-inner">
      <svg viewBox="0 0 500 400" className="w-full h-full">
        {/* Paint / Key Area */}
        <rect x="190" y="0" width="120" height="190" className="fill-muted/30 stroke-border stroke-2" />
        {/* Free Throw Circle */}
        <circle cx="250" cy="190" r="60" className="fill-transparent stroke-border stroke-2" />
        
        {/* Zone 1: Inside Left */}
        <path d="M 0,0 L 190,0 L 190,190 C 120,200 50,120 0,60 Z" className={getStyle(1)} onClick={() => handlePathClick(1)} />
        {/* Zone 2: Inside Center (Paint + FT Area) */}
        <path d="M 190,0 Q 190,200 250,220 Q 310,200 310,0 Z" className={getStyle(2)} onClick={() => handlePathClick(2)} />
        {/* Zone 3: Inside Right */}
        <path d="M 500,0 L 310,0 L 310,190 C 380,200 450,120 500,60 Z" className={getStyle(3)} onClick={() => handlePathClick(3)} />
        
        {/* Three Point Arc (Boundary between inside and outside) */}
        <path d="M 40,0 L 40,120 C 40,280 200,320 250,320 C 300,320 460,280 460,120 L 460,0" className="fill-transparent stroke-foreground stroke-4 pointer-events-none" />

        {/* Zone 4: Outside Left */}
        <path d="M 0,60 C 50,120 40,280 250,320 L 250,400 L 0,400 Z" className={getStyle(4)} onClick={() => handlePathClick(4)} />
        {/* Zone 5: Outside Center (Top of Key outside arc) */}
        <path d="M 250,320 L 250,400 L 250,400 Z" className="hidden" /> {/* Simplified, absorbed partially by 4 & 6 for easier clicking, or we split properly */}
        
        {/* Actually let's refine the outside zones to make 5 available */}
        <path d="M 0,60 C 50,120 40,230 150,280 L 100,400 L 0,400 Z" className={getStyle(4)} onClick={() => handlePathClick(4)} />
        <path d="M 150,280 C 200,310 300,310 350,280 L 400,400 L 100,400 Z" className={getStyle(5)} onClick={() => handlePathClick(5)} />
        <path d="M 350,280 C 460,230 450,120 500,60 L 500,400 L 400,400 Z" className={getStyle(6)} onClick={() => handlePathClick(6)} />

        {/* Hoop/Backboard */}
        <line x1="220" y1="20" x2="280" y2="20" className="stroke-foreground stroke-4" />
        <circle cx="250" cy="35" r="15" className="fill-transparent stroke-orange-500 stroke-4" />
        
        {/* Zone Labels (approximate center for each zone) */}
        <text x="90" y="80" className="text-xl font-bold fill-muted-foreground pointer-events-none">1</text>
        <text x="250" y="100" className="text-xl font-bold fill-muted-foreground pointer-events-none text-anchor-middle">2</text>
        <text x="410" y="80" className="text-xl font-bold fill-muted-foreground pointer-events-none">3</text>
        <text x="60" y="320" className="text-xl font-bold fill-muted-foreground pointer-events-none">4</text>
        <text x="250" y="360" className="text-xl font-bold fill-muted-foreground pointer-events-none text-anchor-middle">5</text>
        <text x="440" y="320" className="text-xl font-bold fill-muted-foreground pointer-events-none">6</text>

      </svg>
    </div>
  );
}
