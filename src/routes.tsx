import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout.tsx";
import HomePage from "./routes/HomePage.tsx";
import JoinCodePage from "./routes/join/JoinCodePage.tsx";
import JoinMembersPage from "./routes/join/JoinMembersPage.tsx";
import CreateTeamsPage from "./routes/create/CreateTeamsPage.tsx";
import LobbyPage from "./routes/LobbyPage.tsx";
import GamePage from "./routes/GamePage.tsx";
import ResultsPage from "./routes/ResultsPage.tsx";
import BanZonePage from "./routes/BanZonePage.tsx";
import FinalResultsPage from "./routes/FinalResultsPage.tsx";
import NotFoundPage from "./routes/NotFoundPage.tsx";
import ErrorPage from "./routes/ErrorPage.tsx";
import StatsPage from "./routes/StatsPage.tsx";

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
        path: "join/code",
        element: <JoinCodePage />,
      },
      {
        path: "session/:sessionCode/stats",
        element: <StatsPage />,
      },
      {
        path: "create/teams",
        element: <CreateTeamsPage />,
      },
      {
        path: "join/members",
        element: <JoinMembersPage />,
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
        path: "session/:sessionCode/ban",
        element: <BanZonePage />,
      },
      {
        path: "session/:sessionCode/final",
        element: <FinalResultsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
