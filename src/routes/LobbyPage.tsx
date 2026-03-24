import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamCard } from "@/components/TeamCard";

// placeholder data until backend session API is wired up
const PLACEHOLDER_TEAMS = [
  { teamNumber: 1, playerCount: 2 },
  { teamNumber: 2, playerCount: 3 },
  { teamNumber: 3, playerCount: 1 },
  { teamNumber: 4, playerCount: 2 },
];

export function LobbyPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-bold">Please wait...</h1>
        <p className="text-sm text-muted-foreground">
          Session code:{" "}
          <span className="font-mono font-semibold tracking-widest">
            {sessionCode}
          </span>
        </p>
      </div>

      {/* Team Grid */}
      <Card className="w-full max-w-sm">
        <CardContent className="grid grid-cols-2 gap-3">
          {PLACEHOLDER_TEAMS.map((team) => (
            <TeamCard
              key={team.teamNumber}
              teamNumber={team.teamNumber}
              playerCount={team.playerCount}
            />
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button
          className="w-full"
          render={<Link to={`/session/${sessionCode}/game`} />}
        >
          Start Game
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          render={<Link to="/" />}
        >
          Leave Session
        </Button>
      </div>
    </div>
  );
}

export default LobbyPage;
