import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomDock } from "@/components/layout/Bottomdock"
import { TopBar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/Pageheader";

const MOCK_USER ={
    name: "Kamau Njoroge",
    role: "cashier",
};

export const AppShell = () => {
    return(
        <div className="min-h-screen bg-[#F8FAFC] font-sans">
            {/*Desktop sidebar */}
            <Sidebar userName={MOCK_USER.name} userRole={MOCK_USER.role}/>

            {/*Mobile Topbar */}
            <TopBar userName={MOCK_USER.name} />

            {/* Main content area */}
            <div className="md:ml-64 flex flex-col min-h-screen">
                {/* Desktop Page header */}
                <PageHeader userName={MOCK_USER.name} userRole={MOCK_USER.role}/>

                {/* Page content -routed pages render here */}
                <main className="flex px-4 py-4 md:px-8 md:py-6 
                                 pt-[72px] md:pt-0 /* mobile Topbar enabler */
                                 pb-[80px] md:pb-0 /* mobile Bottomdock enabler */
                                 overflow-y-auto
                                 ">
                <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-6">  
                <Outlet/>
                </div>
                </main>
            </div>
            {/* Mobile bottom Dock */}
            <BottomDock/>
        </div>
    );
};
