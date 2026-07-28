import { Outlet, useLocation } from "react-router-dom";
import { Sidebar }    from "./Sidebar";
import { BottomDock } from "@/components/layout/Bottomdock";
import { TopBar }     from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/Pageheader";

const MOCK_USER = { name: "Kamau Njoroge", role: "admin" };

const DOCK_HIDDEN_ROUTES   = ["/"];
const TOPBAR_HIDDEN_ROUTES = ["/"];

export const AppShell = () => {
  const { pathname } = useLocation();
  const hideDock   = DOCK_HIDDEN_ROUTES.includes(pathname);
  const hideTopBar = TOPBAR_HIDDEN_ROUTES.includes(pathname);
  const isDashboard = pathname === "/";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      <Sidebar userName={MOCK_USER.name} userRole={MOCK_USER.role} />

      {!hideTopBar && <TopBar userName={MOCK_USER.name} />}

      <div className="md:ml-64 flex flex-col min-h-screen">

        {!isDashboard && (
          <PageHeader userName={MOCK_USER.name} userRole={MOCK_USER.role} />
        )}

        <main
          className={[
            "flex-1 overflow-y-auto",
            !hideTopBar ? "pt-[72px] md:pt-0" : "pt-0",
            !hideDock   ? "pb-[80px] md:pb-0"  : "pb-0",
          ].join(" ")}
        >
          {isDashboard ? (
            <div className="w-full px-4 py-4 md:px-8 md:py-6">
              <Outlet />
            </div>
          ) : (
            <div className="w-full max-w-5xl px-4 py-4 md:px-8 md:py-6 md:mx-0">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {!hideDock && <BottomDock />}
    </div>
  );
};