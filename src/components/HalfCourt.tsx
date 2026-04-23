import { useRef, useState, useCallback, useEffect } from "react";
import courtImage from "@/assets/basketballcourt.png";

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
  percentage: number | null;
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

// ── Image dimensions (matching the 512x479 PNG) ──
const IMG_W = 512;
const IMG_H = 479;

// Zone centers — visually matched to the court PNG
const ZONE_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 256, y: 100 },
  2: { x: 100, y: 150 },
  3: { x: 412, y: 150 },
  4: { x: 70,  y: 370 },
  5: { x: 256, y: 390 },
  6: { x: 442, y: 370 },
};

function getBadgeColor(percentage: number | null, attempts: number) {
  if (attempts === 0 || percentage === null) return "hsl(var(--muted))";
  if (percentage >= 50) return "hsl(142 71% 45%)";
  if (percentage >= 25) return "hsl(48 96% 53%)";
  return "hsl(0 84% 60%)";
}

function getZoneHeatFill(percentage: number | null, attempts: number): string {
  if (attempts === 0 || percentage === null) return "transparent";
  if (percentage >= 60) return "rgba(34,197,94,0.30)";
  if (percentage >= 40) return "rgba(234,179,8,0.30)";
  if (percentage >= 20) return "rgba(249,115,22,0.30)";
  return "rgba(239,68,68,0.30)";
}

// ── Zone interaction layers mapped to the 512x479 court image ──
const ZONE_INTERACTION_LAYERS = [
  // Zone 1 — paint/key area (blue rectangle)
  { z: 1, type: "rect" as const, x: 185, y: 0, width: 142, height: 185, clip: undefined, points: undefined },
  // Zone 2 — inside arc, left of key
  { z: 2, type: "polygon" as const, points: "25,0 185,0 185,185 256,185 256,320 25,320", clip: "url(#insideArcClip)", x: undefined, y: undefined, width: undefined, height: undefined },
  // Zone 3 — inside arc, right of key
  { z: 3, type: "polygon" as const, points: "487,0 327,0 327,185 256,185 256,320 487,320", clip: "url(#insideArcClip)", x: undefined, y: undefined, width: undefined, height: undefined },
  // Zone 4 — outside arc, left corner
  { z: 4, type: "polygon" as const, points: "25,120 185,265 25,479", clip: "url(#outsideArcClip)", x: undefined, y: undefined, width: undefined, height: undefined },
  // Zone 5 — outside arc, center
  { z: 5, type: "polygon" as const, points: "185,265 327,265 487,479 25,479", clip: "url(#outsideArcClip)", x: undefined, y: undefined, width: undefined, height: undefined },
  // Zone 6 — outside arc, right corner
  { z: 6, type: "polygon" as const, points: "487,120 327,265 487,479", clip: "url(#outsideArcClip)", x: undefined, y: undefined, width: undefined, height: undefined },
] as const;

// ── Component ──

export function HalfCourt({
  shots,
  bannedZone,
  onShotPlaced,
  disabled,
  zoneStats,
  interactiveBanMode,
  onZoneClick,
}: HalfCourtProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [pending, setPending] = useState<{
    svgX: number;
    svgY: number;
    screenX: number;
    screenY: number;
    zone: number;
    wrapperWidth: number;
  } | null>(null);

  // Convert screen coords to SVG coords
  const toSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || !wrapperRef.current) return null;
      const svgRect = svgRef.current.getBoundingClientRect();
      const wrapRect = wrapperRef.current.getBoundingClientRect();
      const scaleX = IMG_W / svgRect.width;
      const scaleY = IMG_H / svgRect.height;
      return {
        svgX: (clientX - svgRect.left) * scaleX,
        svgY: (clientY - svgRect.top) * scaleY,
        screenX: clientX - wrapRect.left,
        screenY: clientY - wrapRect.top,
      };
    },
    []
  );

  const handleZoneInteraction = useCallback(
    (e: React.MouseEvent, zone: number) => {
      e.stopPropagation();
      const pt = toSvgPoint(e.clientX, e.clientY);
      if (!pt) return;

      if (interactiveBanMode && onZoneClick) {
        onZoneClick(zone);
        return;
      }

      if (disabled || !onShotPlaced) return;
      if (bannedZone === zone) return;

      setPending({ ...pt, zone, wrapperWidth: wrapperRef.current?.clientWidth ?? IMG_W });
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
  const attempts = shots.length;
  const misses = attempts - makes;

  return (
    <div ref={wrapperRef} className="relative flex-shrink-0 select-none">
      <svg
        ref={svgRef}
        width={IMG_W}
        height={IMG_H}
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        className="block rounded-xl border border-border/50 w-full max-w-[512px] shadow-lg"
        style={{ cursor: disabled ? "default" : "crosshair" }}
      >
        <defs>
          {/* Banned zone hatching pattern */}
          <pattern id="bannedZonePattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="24" height="24" fill="rgba(239, 68, 68, 0.12)" />
            <line x1="0" y1="0" x2="0" y2="24" stroke="rgba(239, 68, 68, 0.25)" strokeWidth="6" />
          </pattern>
          <clipPath id="insideArcClip">
            <path d={`M25,0 L487,0 L487,120 A240,240 0 0,1 25,120 Z`} />
          </clipPath>
          <clipPath id="outsideArcClip">
            <path d={`M25,120 A240,240 0 0,0 487,120 L487,479 L25,479 Z`} />
          </clipPath>
        </defs>

        {/* Court background image */}
        <image href={courtImage} x="0" y="0" width={IMG_W} height={IMG_H} />

        {/* ── Shot dots ── */}
        {shots.map((s) => (
          <circle
            key={s.id}
            cx={s.svgX}
            cy={s.svgY}
            r="11"
            fill={s.made ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"}
            stroke={s.made ? "hsl(142 71% 25%)" : "hsl(0 84% 30%)"}
            strokeWidth="2"
            opacity="0.9"
            style={{ pointerEvents: "none" }}
          />
        ))}

        {/* Pending circle */}
        {pending && (
          <circle
            cx={pending.svgX}
            cy={pending.svgY}
            r="11"
            fill="hsl(var(--background))"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            opacity="0.85"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* ── Stats row (makes / total / misses) — only in interactive mode ── */}
        {onShotPlaced && (
          <foreignObject x="0" y={IMG_H - 48} width={IMG_W} height="48">
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-1.5 bg-green-500/90 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                <span className="text-lg">{makes}</span>
                <span className="text-[10px] uppercase opacity-80">made</span>
              </div>
              <div className="bg-background/80 backdrop-blur text-foreground text-sm font-black px-3 py-1.5 rounded-lg border border-border shadow-sm">
                {attempts} shots
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/90 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                <span className="text-lg">{misses}</span>
                <span className="text-[10px] uppercase opacity-80">miss</span>
              </div>
            </div>
          </foreignObject>
        )}

        {/* Zone interaction layers */}
        {ZONE_INTERACTION_LAYERS.map(({ z, type, points, x, y, width, height, clip }) => {
          const isBanned = bannedZone === z;
          const zs = zoneStats?.[z];
          const heatFill = zs ? getZoneHeatFill(zs.percentage, zs.attempts) : "transparent";
          const fill = isBanned ? "url(#bannedZonePattern)" : heatFill;
          const classes = isBanned ? "animate-pulse stroke-red-500 stroke-2" : "";
          const cursor = isBanned ? "not-allowed" : (interactiveBanMode ? "crosshair" : (disabled ? "default" : "crosshair"));

          const clickHandler = (e: React.MouseEvent) => handleZoneInteraction(e, z);

          return type === "rect" ? (
            <rect key={z} x={x} y={y} width={width} height={height} fill={fill} clipPath={clip} className={classes} style={{ cursor }} onClick={clickHandler} />
          ) : (
            <polygon key={z} points={points} fill={fill} clipPath={clip} className={classes} style={{ cursor }} onClick={clickHandler} />
          );
        })}

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
                x={center.x - 40}
                y={center.y - 25}
                width="80"
                height="50"
                onClick={(e) => {
                  if (interactiveBanMode && onZoneClick) {
                    e.stopPropagation();
                    onZoneClick(zone);
                  }
                }}
                style={{ cursor: interactiveBanMode ? "pointer" : "default" }}
              >
                <div
                  className="flex flex-col items-center justify-center w-full h-full rounded-lg shadow-lg border border-white/40 text-white font-black leading-tight backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-lg tracking-tight">{stat.percentage !== null ? `${Math.round(stat.percentage)}%` : "—"}</span>
                  <span className="text-[9px] opacity-80">{stat.makes}/{stat.attempts}</span>
                </div>
              </foreignObject>
            );
          })}
      </svg>

      {/* ── Make / Miss overlay ── */}
      {pending && (
        <div
          className="absolute flex gap-2 items-center z-30 pointer-events-auto"
          style={{
            left: `${Math.max(30, Math.min(pending.screenX, pending.wrapperWidth - 30))}px`,
            top: `${Math.max(60, pending.screenY)}px`,
            transform: "translate(-50%, -115%)",
          }}
        >
          <button
            onClick={handleMake}
            className="w-11 h-11 rounded-xl border-2 text-lg font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-green-500 border-green-700 text-white cursor-pointer"
          >
            ✓
          </button>
          <button
            onClick={handleMiss}
            className="w-11 h-11 rounded-xl border-2 text-lg font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-red-500 border-red-700 text-white cursor-pointer"
          >
            ✗
          </button>
        </div>
      )}
    </div>
  );
}

export default HalfCourt;
