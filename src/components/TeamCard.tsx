import { Card, CardContent } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  teamNumber: number;
  players: string[];
  isHighlighted?: boolean;
  isReady?: boolean;
  className?: string;
}

export function TeamCard({
  teamNumber,
  players,
  isHighlighted = false,
  isReady = false,
  className,
}: TeamCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Card
          className={cn(
            "cursor-default transition-all duration-200 relative",
            isHighlighted && "ring-2 ring-foreground",
            isReady && "border-green-500/50 bg-green-500/5",
            className,
          )}
        >
          {isReady && (
            <div className="absolute top-2 right-2 size-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Ready" />
          )}
          <CardContent className="flex flex-col items-center gap-1 py-3">
            <span className="text-sm font-semibold">Team {teamNumber}</span>
            <span className="text-xs text-muted-foreground">
              {players.length} {players.length === 1 ? "player" : "players"}
            </span>
            {isReady && <span className="text-xs font-bold tracking-wider text-green-600 mt-0.5">READY</span>}
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-48">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold">Team {teamNumber} Members</p>
          {players.length > 0 ? (
            <ul className="text-xs text-muted-foreground">
              {players.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No players yet</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default TeamCard;
