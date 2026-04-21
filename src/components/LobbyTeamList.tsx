import { TeamCard } from "@/components/TeamCard";

interface FormattedTeam {
  teamNumber: number;
  teamId: string;
  isReady: boolean;
  players: string[];
}

interface LobbyTeamListProps {
  teams: FormattedTeam[];
  currentTeamId: string | null;
  targetTeams: number;
}

/**
 * Renders the grid of team cards in the lobby.
 */
export function LobbyTeamList({
  teams,
  currentTeamId,
  targetTeams,
}: LobbyTeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Waiting for teams to join...
      </div>
    );
  }

  const gridClasses =
    targetTeams === 1
      ? "grid-cols-1"
      : targetTeams === 2
      ? "grid-cols-2"
      : "grid-cols-2";

  return (
    <div className={`grid gap-3 ${gridClasses}`}>
      {teams.map((team) => (
        <TeamCard
          key={team.teamNumber}
          teamNumber={team.teamNumber}
          players={team.players}
          isHighlighted={team.teamId === currentTeamId}
          isReady={team.isReady}
          className="hover:scale-[1.02] transition-transform duration-300"
        />
      ))}
    </div>
  );
}

export default LobbyTeamList;
