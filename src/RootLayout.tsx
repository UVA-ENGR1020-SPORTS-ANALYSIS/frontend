import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

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
