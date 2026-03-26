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
  className?: string;
}

export function TeamCard({
  teamNumber,
  players,
  isHighlighted = false,
  className,
}: TeamCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Card
          className={cn(
            "cursor-default transition-all duration-200",
            isHighlighted && "ring-2 ring-foreground",
            className,
          )}
        >
          <CardContent className="flex flex-col items-center gap-1 py-2">
            <span className="text-sm font-semibold">Team {teamNumber}</span>
            <span className="text-xs text-muted-foreground">
              {players.length} {players.length === 1 ? "player" : "players"}
            </span>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-48">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold">Team {teamNumber} Members</p>
          {players.length > 0 ? (
            <ul className="text-xs text-muted-foreground">
              {players.map((name) => (
                <li key={name}>{name}</li>
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
