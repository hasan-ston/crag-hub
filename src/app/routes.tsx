import { createBrowserRouter, Outlet } from "react-router";
import { NavBar } from "@/components/nav-bar";
import { HomeScreen } from "@/components/home-screen";
import { WallView } from "@/components/wall-view";
import { StatsScreen } from "@/components/stats-screen";
import { ProfileScreen } from "@/components/profile-screen";
import { AdminScreen } from "@/components/admin-screen";

function RootLayout() {
  return (
    <>
      <Outlet />
      <NavBar />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomeScreen },
      { path: "walls", Component: HomeScreen },
      { path: "stats", Component: StatsScreen },
      { path: "profile", Component: ProfileScreen },
    ],
  },
  {
    path: "/wall/:wallId",
    Component: WallView,
  },
  {
    path: "/admin",
    Component: AdminScreen,
  },
]);
