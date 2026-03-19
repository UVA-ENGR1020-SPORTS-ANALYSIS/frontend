import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">
        Page not found. The page you're looking for doesn't exist.
      </p>
      <Button render={<Link to="/" />}>Back to Home</Button>
    </div>
  );
}

export default NotFoundPage;
