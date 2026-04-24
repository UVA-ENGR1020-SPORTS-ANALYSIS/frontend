import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LogIn, Users, Target, Trophy } from "lucide-react";
import { TabletopLogo } from "@/components/TabletopLogo";

const HOW_TO_PLAY = [
  {
    step: "1",
    icon: Users,
    title: "Set Up Your Team",
    body: "Create a session or join with a 6-digit code. Add your players and wait for everyone to be ready.",
  },
  {
    step: "2",
    icon: Target,
    title: "Take Your Shots",
    body: "Each player shoots 5 times across 6 zones. Tap the court where you shot, then mark it as a make or miss.",
  },
  {
    step: "3",
    icon: Trophy,
    title: "Ban & Win",
    body: "After Round 1, ban an opponent's zone. Play Round 2, and the team with the most total points wins.",
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 gap-10">
      <div className="flex flex-col items-center w-full">
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

      <section className="w-full max-w-3xl">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-5">
          How to Play
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOW_TO_PLAY.map(({ step, icon: Icon, title, body }) => (
            <Card key={step} size="sm" className="h-full">
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Step {step}
                  </span>
                </div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
