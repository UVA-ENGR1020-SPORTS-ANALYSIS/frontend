import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogIn } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const handleCreateGame = () => {
    navigate("/create/teams");
  };

  const handleJoinGame = () => {
    navigate("/join/code");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-4xl font-bold">TABLETOP</h1>

      <Card className="w-full max-w-xs py-4">
        <CardContent className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Welcome to the game
          </p>
          <Button
            variant="default"
            size="lg"
            className="w-full gap-2"
            onClick={handleCreateGame}
          >
            <Plus className="size-4" />
            Create Game
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={handleJoinGame}
          >
            <LogIn className="size-4" />
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default HomePage;
