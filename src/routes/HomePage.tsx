import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

type TeamCount = 1 | 2 | 4;

export function HomePage() {
  const navigate = useNavigate();

  const handleTeamSelect = (count: TeamCount) => {
    if (count === 1) {
      // Single team doesn't need a session code
      navigate("/join/members?teams=1");
    } else {
      navigate(`/join/code?teams=${count}`);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      <Card className="w-full max-w-xs py-4">
        <CardContent className="flex flex-col gap-3">
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
            >
              <Users className="size-4" />
              {count}-Team Game
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default HomePage;
