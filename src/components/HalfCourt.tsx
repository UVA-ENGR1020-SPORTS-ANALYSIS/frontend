import { useRef, useState, useCallback, useEffect } from "react";

// ── Types ──

export interface ShotDot {
  id: string;
  svgX: number;
  svgY: number;
  made: boolean;
  zone: number;
  playerId: string;
}

export interface ZoneStat {
  makes: number;
  attempts: number;
  percentage: number;
}

interface HalfCourtProps {
  shots: ShotDot[];
  bannedZone?: number | null;
  onShotPlaced?: (svgX: number, svgY: number, zone: number, made: boolean) => void;
  disabled?: boolean;
  zoneStats?: Record<number, ZoneStat>;
  interactiveBanMode?: boolean;
  onZoneClick?: (zone: number) => void;
}

const ZONE_CENTERS: Record<number, {x: number, y: number}> = {
  1: { x: 245, y: 120 },
  2: { x: 95, y: 175 },
  3: { x: 395, y: 175 },
  4: { x: 82, y: 430 },
  5: { x: 245, y: 440 },
  6: { x: 408, y: 430 },
};

function getBadgeColor(percentage: number, attempts: number) {
  if (attempts === 0) return "#9ca3af"; // gray-400
  if (percentage >= 50) return "#22c55e"; // green-500
  if (percentage >= 25) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

// ── Zone detection ──

function getZone(x: number, y: number): number {
  // Court bounds: x in [30..460], y in [18..512]
  // Zone 1: inside the key (rect 182..308, y 18..206)
  if (x >= 182 && x <= 308 && y <= 206) return 1;

  // Check if inside three-point arc
  // The arc is centered at (245, 148) with radius 222 (approximately)
  const arcCx = 245, arcCy = 148, arcR = 222;
  const dist = Math.sqrt((x - arcCx) ** 2 + (y - arcCy) ** 2);
  const insideArc = dist < arcR && y < 370;

  if (insideArc) {
    // Inside arc, left or right of key
    if (x < 245) return 2; // upper-left
    return 3; // upper-right
  }

  // Outside arc — use diagonal divider lines to split into zones 4, 5, 6
  // Left diagonal: (182,306) → (30,512)
  // Right diagonal: (308,306) → (460,512)
  // Center vertical: x=245, y 206..315

  // Left of center diagonal
  const leftSlope = (512 - 306) / (30 - 182); // negative
  const leftY = 306 + leftSlope * (x - 182);

  const rightSlope = (512 - 306) / (460 - 308);
  const rightY = 306 + rightSlope * (x - 308);

  if (x < 182 || (x < 245 && y > leftY)) return 4; // lower-left
  if (x > 308 || (x > 245 && y > rightY)) return 6; // lower-right
  return 5; // lower-center
}

// ── Component ──

export function HalfCourt({ 
  shots, 
  bannedZone, 
  onShotPlaced, 
  disabled, 
  zoneStats, 
  interactiveBanMode, 
  onZoneClick 
}: HalfCourtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [pending, setPending] = useState<{
    svgX: number;
    svgY: number;
    screenX: number;
    screenY: number;
    zone: number;
  } | null>(null);

  // Convert screen coords to SVG coords
  const toSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || !wrapperRef.current) return null;
      const svgRect = svgRef.current.getBoundingClientRect();
      const wrapRect = wrapperRef.current.getBoundingClientRect();
      const scaleX = 490 / svgRect.width;
      const scaleY = 530 / svgRect.height;
      return {
        svgX: (clientX - svgRect.left) * scaleX,
        svgY: (clientY - svgRect.top) * scaleY,
        screenX: clientX - wrapRect.left,
        screenY: clientY - wrapRect.top,
      };
    },
    []
  );

  const handleCourtClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const pt = toSvgPoint(e.clientX, e.clientY);
      if (!pt) return;

      const zone = getZone(pt.svgX, pt.svgY);

      if (interactiveBanMode && onZoneClick) {
        onZoneClick(zone);
        return;
      }

      if (disabled || !onShotPlaced) return;
      if (bannedZone === zone) return;

      setPending({ ...pt, zone });
    },
    [toSvgPoint, disabled, bannedZone, interactiveBanMode, onZoneClick, onShotPlaced]
  );

  const handleMake = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!pending || !onShotPlaced) return;
      onShotPlaced(pending.svgX, pending.svgY, pending.zone, true);
      setPending(null);
    },
    [pending, onShotPlaced]
  );

  const handleMiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!pending || !onShotPlaced) return;
      onShotPlaced(pending.svgX, pending.svgY, pending.zone, false);
      setPending(null);
    },
    [pending, onShotPlaced]
  );

  // Dismiss on outside click or escape
  useEffect(() => {
    const dismiss = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setPending(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPending(null);
    };
    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // Stats
  const makes = shots.filter((s) => s.made).length;
  const misses = shots.filter((s) => !s.made).length;
  const attempts = shots.length;

  return (
    <div ref={wrapperRef} className="relative flex-shrink-0 select-none">
      <svg
        ref={svgRef}
        width="490"
        height="530"
        viewBox="0 0 490 530"
        className="block rounded shadow-[0_5px_22px_rgba(0,0,0,0.38)] w-full max-w-[490px]"
        style={{ cursor: disabled ? "default" : "crosshair" }}
      >
        <defs>
          {/* Hardwood floor gradient */}
          <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b06c28" />
            <stop offset="8%" stopColor="#c8843c" />
            <stop offset="18%" stopColor="#d49244" />
            <stop offset="28%" stopColor="#be7a30" />
            <stop offset="38%" stopColor="#cc8a3e" />
            <stop offset="50%" stopColor="#d49040" />
            <stop offset="62%" stopColor="#c4802e" />
            <stop offset="72%" stopColor="#d09040" />
            <stop offset="83%" stopColor="#c88438" />
            <stop offset="92%" stopColor="#be7a2e" />
            <stop offset="100%" stopColor="#b07028" />
          </linearGradient>

          {/* Vertical plank lines */}
          <pattern
            id="planks"
            x="0"
            y="0"
            width="26"
            height="530"
            patternUnits="userSpaceOnUse"
          >
            <rect width="26" height="530" fill="none" />
            <line
              x1="25.5"
              y1="0"
              x2="25.5"
              y2="530"
              stroke="rgba(0,0,0,0.055)"
              strokeWidth="1"
            />
          </pattern>

          {/* Subtle grain */}
          <pattern
            id="grain"
            x="0"
            y="0"
            width="26"
            height="90"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="44"
              x2="26"
              y2="44"
              stroke="rgba(0,0,0,0.025)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        {/* Floor base */}
        <rect width="490" height="530" fill="url(#wood)" />
        <rect width="490" height="530" fill="url(#planks)" />
        <rect width="490" height="530" fill="url(#grain)" />

        {/* Court boundary */}
        <rect
          x="30"
          y="18"
          width="430"
          height="494"
          fill="none"
          stroke="#111"
          strokeWidth="2.5"
        />

        {/* Key / Lane */}
        <rect
          x="182"
          y="18"
          width="126"
          height="188"
          fill="rgba(160,65,20,0.13)"
          stroke="#111"
          strokeWidth="2.2"
        />

        {/* Free-throw circle — dashed top */}
        <path
          d="M182,206 A63,63 0 0,0 308,206"
          fill="none"
          stroke="#111"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        {/* Free-throw circle — solid bottom */}
        <path
          d="M182,206 A63,63 0 0,1 308,206"
          fill="none"
          stroke="#111"
          strokeWidth="2"
        />

        {/* Three-point line straight edges */}
        <line x1="30" y1="18" x2="30" y2="148" stroke="#111" strokeWidth="2.2" />
        <line x1="460" y1="18" x2="460" y2="148" stroke="#111" strokeWidth="2.2" />
        {/* Three-point arc */}
        <path
          d="M30,148 A222,222 0 0,0 460,148"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
        />

        {/* Restricted-area arc */}
        <path
          d="M213,18 A32,32 0 0,0 277,18"
          fill="none"
          stroke="#111"
          strokeWidth="1.8"
        />

        {/* Backboard */}
        <rect x="207" y="20" width="76" height="5" rx="1.5" fill="#111" />
        {/* Rim post */}
        <line x1="245" y1="25" x2="245" y2="38" stroke="#555" strokeWidth="2" />
        {/* Rim circle */}
        <circle
          cx="245"
          cy="49"
          r="17"
          fill="none"
          stroke="#d96020"
          strokeWidth="3"
        />
        {/* Net suggestion */}
        <path
          d="M234,49 Q238,62 245,66 Q252,62 256,49"
          fill="none"
          stroke="#c85818"
          strokeWidth="1.2"
          strokeDasharray="2,2"
        />

        {/* Half-court circle at bottom */}
        <circle cx="245" cy="512" r="58" fill="none" stroke="#111" strokeWidth="2" />

        {/* ── Zone divider lines ── */}
        <line x1="245" y1="206" x2="245" y2="315" stroke="#111" strokeWidth="2.2" />
        <line x1="182" y1="306" x2="30" y2="512" stroke="#111" strokeWidth="2.2" />
        <line x1="308" y1="306" x2="460" y2="512" stroke="#111" strokeWidth="2.2" />

        {/* ── Zone labels ── */}
        <text
          x="245"
          y="120"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          1
        </text>
        <text
          x="95"
          y="175"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          2
        </text>
        <text
          x="395"
          y="175"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          3
        </text>
        <text
          x="82"
          y="430"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          4
        </text>
        <text
          x="245"
          y="440"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          5
        </text>
        <text
          x="408"
          y="430"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="rgba(0,0,0,0.42)"
          style={{ pointerEvents: "none" }}
        >
          6
        </text>

        {/* ── Shot dots ── */}
        {shots.map((s) => (
          <circle
            key={s.id}
            cx={s.svgX}
            cy={s.svgY}
            r="12"
            fill={s.made ? "#22c55e" : "#ef4444"}
            stroke={s.made ? "#14532d" : "#7f1d1d"}
            strokeWidth="2"
            opacity="0.92"
            style={{ pointerEvents: "none" }}
          />
        ))}

        {/* Pending circle */}
        {pending && (
          <circle
            cx={pending.svgX}
            cy={pending.svgY}
            r="12"
            fill="white"
            stroke="#aaa"
            strokeWidth="2"
            opacity="0.88"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* ── Stats badges ── */}
        <rect
          x="30"
          y="466"
          width="54"
          height="46"
          rx="5"
          fill="rgba(22,101,52,0.88)"
        />
        <text
          x="57"
          y="497"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fill="#4ade80"
          style={{ pointerEvents: "none" }}
        >
          {makes}
        </text>

        <text
          x="245"
          y="499"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fill="white"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="2"
          paintOrder="stroke"
          style={{ pointerEvents: "none" }}
        >
          {attempts}
        </text>

        <rect
          x="406"
          y="466"
          width="54"
          height="46"
          rx="5"
          fill="rgba(127,29,29,0.88)"
        />
        <text
          x="433"
          y="497"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fill="#fca5a5"
          style={{ pointerEvents: "none" }}
        >
          {misses}
        </text>

        {/* Invisible click target */}
        <rect
          x="30"
          y="18"
          width="430"
          height="440"
          fill="transparent"
          style={{ cursor: interactiveBanMode ? "crosshair" : (disabled ? "default" : "crosshair") }}
          onClick={handleCourtClick}
        />

        {/* ── Heatmap Overlay ── */}
        {zoneStats &&
          Object.entries(zoneStats).map(([zoneStr, stat]) => {
            const zone = parseInt(zoneStr);
            const center = ZONE_CENTERS[zone];
            if (!center) return null;
            const color = getBadgeColor(stat.percentage, stat.attempts);

            return (
              <foreignObject
                key={`badge-${zone}`}
                x={center.x - 45}
                y={center.y - 30}
                width="90"
                height="60"
                onClick={(e) => {
                  if (interactiveBanMode && onZoneClick) {
                    e.stopPropagation();
                    onZoneClick(zone);
                  }
                }}
                style={{ cursor: interactiveBanMode ? "pointer" : "default" }}
              >
                <div 
                  className="flex flex-col items-center justify-center w-full h-full rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] border-2 border-white/60 text-white font-black leading-tight backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: color + "ee" }}
                >
                  <span className="text-xl tracking-tighter">{Math.round(stat.percentage)}%</span>
                  <span className="text-[10px] opacity-90">{stat.makes}/{stat.attempts}</span>
                </div>
              </foreignObject>
            );
          })}
      </svg>

      {/* ── Make / Miss overlay ── */}
      {pending && (
        <div
          className="absolute flex gap-2.5 items-center z-30 pointer-events-auto"
          style={{
            left: `${Math.max(30, Math.min(pending.screenX, (wrapperRef.current?.clientWidth ?? 490) - 30))}px`,
            top: `${Math.max(60, pending.screenY)}px`,
            transform: "translate(-50%, -115%)",
          }}
        >
          <button
            onClick={handleMake}
            className="w-[42px] h-[42px] rounded-lg border-[2.5px] text-xl font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:scale-[1.15] transition-transform bg-green-500 border-green-800 text-white cursor-pointer"
          >
            ✓
          </button>
          <button
            onClick={handleMiss}
            className="w-[42px] h-[42px] rounded-lg border-[2.5px] text-xl font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:scale-[1.15] transition-transform bg-red-500 border-red-800 text-white cursor-pointer"
          >
            ✗
          </button>
        </div>
      )}
    </div>
  );
}

export default HalfCourt;
