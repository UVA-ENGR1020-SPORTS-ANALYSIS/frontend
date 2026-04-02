import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TeamCard } from "@/components/TeamCard";
import { Users, LogOut, Play } from "lucide-react";

// placeholder data until backend session API is wired up
const PLACEHOLDER_TEAMS = [
  { teamNumber: 1, players: ["Lamin", "Sachin"] },
  { teamNumber: 2, players: ["Micah", "Frank", "Nate"] },
  { teamNumber: 3, players: ["Alex"] },
  { teamNumber: 4, players: ["Jordan", "Taylor"] },
];

export function LobbyPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();

  // Optional: calculate layout dynamically based on teams length
  const numTeams = PLACEHOLDER_TEAMS.length;
  const gridClasses = 
    numTeams === 1 ? "grid-cols-1" :
    numTeams === 2 ? "grid-cols-2" :
    "grid-cols-2"; // 3 or 4 teams look good in a 2x2 grid

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header / Room Code */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-muted-foreground">Waiting Lobby</h1>
          <div className="w-full rounded-2xl border-2 border-dashed bg-card p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Room Code</span>
            <span className="text-5xl md:text-6xl font-black tracking-[0.2em] text-foreground">
              {sessionCode}
            </span>
          </div>
        </div>

        {/* Teams Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              Teams Joined
            </h2>
            <span className="text-sm border rounded-full px-2.5 py-0.5 bg-muted font-medium text-muted-foreground">
              {numTeams} / 4
            </span>
          </div>
          
          <div className={`grid gap-3 ${gridClasses}`}>
            {PLACEHOLDER_TEAMS.map((team) => (
              <TeamCard
                key={team.teamNumber}
                teamNumber={team.teamNumber}
                players={team.players}
                className="hover:scale-[1.02] transition-transform duration-300"
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            size="lg"
            className="w-full gap-2 text-lg h-14"
            render={<Link to={`/session/${sessionCode}/game`} />}
            nativeButton={false}
          >
            <Play className="size-5 fill-current" />
            Start Game
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-destructive transition-colors"
            render={<Link to="/" />}
            nativeButton={false}
          >
            <LogOut className="size-4" />
            Leave Session
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LobbyPage;
