import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  teamNumber: number;
  playerCount: number;
  isHighlighted?: boolean;
  className?: string;
}

export function TeamCard({
  teamNumber,
  playerCount,
  isHighlighted = false,
  className,
}: TeamCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isHighlighted && "ring-2 ring-foreground",
        className,
      )}
    >
      <CardContent className="flex flex-col items-center gap-1 py-2">
        <span className="text-sm font-semibold">Team {teamNumber}</span>
        <span className="text-xs text-muted-foreground">
          {playerCount} {playerCount === 1 ? "player" : "players"}
        </span>
      </CardContent>
    </Card>
  );
}

export default TeamCard;
