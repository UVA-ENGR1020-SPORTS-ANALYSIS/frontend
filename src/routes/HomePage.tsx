import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogIn } from "lucide-react";
import { TabletopLogo } from "@/components/TabletopLogo";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <TabletopLogo className="mb-1" />
      <p className="mb-6 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
        Basketball Shot Tracker
      </p>

      <Card className="w-full max-w-xs py-4">
        <CardContent className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Welcome to the game
          </p>
          <Button
            variant="default"
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate("/create/teams")}
          >
            <Plus className="size-4" />
            Create Game
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate("/join/code")}
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
