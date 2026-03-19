import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout.tsx";
import HomePage from "./routes/HomePage.tsx";
import LobbyPage from "./routes/LobbyPage.tsx";
import GamePage from "./routes/GamePage.tsx";
import ResultsPage from "./routes/ResultsPage.tsx";
import NotFoundPage from "./routes/NotFoundPage.tsx";
import ErrorPage from "./routes/ErrorPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "session/:sessionCode/lobby",
        element: <LobbyPage />,
      },
      {
        path: "session/:sessionCode/game",
        element: <GamePage />,
      },
      {
        path: "session/:sessionCode/results",
        element: <ResultsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
