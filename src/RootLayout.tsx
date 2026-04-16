import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export const meta = {
  title: "Tabletop",
  description:
    "Track basketball shots, compete with friends, and analyze your game — all from your tabletop.",
};

export function RootLayout() {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
    </>
  );
}

export default RootLayout;
