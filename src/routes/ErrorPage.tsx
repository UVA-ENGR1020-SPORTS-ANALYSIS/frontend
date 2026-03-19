import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} Error`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">Oops!</h1>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="max-w-md text-lg text-muted-foreground">{message}</p>
      <Button render={<Link to="/" />}>Back to Home</Button>
    </div>
  );
}

export default ErrorPage;
