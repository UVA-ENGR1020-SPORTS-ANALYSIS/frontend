import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionDetails } from "@/api/sessions";

/**
 * Polls session details every 3s to check if the opponent has banned a zone
 * on our team. When detected, navigates to the game page.
 */
export function useOpponentBanPoll(
  sessionCode: string | undefined,
  isActive: boolean
) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isActive || !sessionCode) return;

    const interval = setInterval(async () => {
      try {
        const teamId = sessionStorage.getItem("currentTeamId");
        const details = await getSessionDetails(sessionCode);
        const myTeam = details.teams.find((t) => t.team_id === teamId);
        if (myTeam && myTeam.banned_zone !== null) {
          clearInterval(interval);
          navigate(`/session/${sessionCode}/game`);
        }
      } catch (err) {
        console.error("Failed checking if opponent banned us:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, sessionCode, navigate]);
}
