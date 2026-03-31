import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ArrowLeft } from "lucide-react";
import { createSession } from "@/api/sessions";

type TeamCount = 1 | 2 | 4;

export function CreateTeamsPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleTeamSelect = async (count: TeamCount) => {
    try {
      setIsCreating(true);
      const res = await createSession({ team_count: count });
      
      // Navigate host to name-entry to register their own playing team
      navigate(`/join/members?code=${res.session_code}`);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      <Card className="w-full max-w-xs py-4">
        <CardContent className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            disabled={isCreating}
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          <p className="text-center text-sm text-muted-foreground">
            How many teams are playing?
          </p>
          {([1, 2, 4] as TeamCount[]).map((count) => (
            <Button
              key={count}
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => handleTeamSelect(count)}
              disabled={isCreating}
            >
              <Users className="size-4" />
              {count}-Team Game
            </Button>
          ))}
          {isCreating && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Creating session...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateTeamsPage;
