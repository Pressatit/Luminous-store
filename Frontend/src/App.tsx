import { BrowserRouter ,Route ,Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashBoard } from "./pages/DashBoard.tsx";
import { ReceiveStockPage } from "@/pages/ReceiveStock";
import { DispatchPage } from "@/pages/DispatchItems";
import { InventoryPage } from "@/pages/InventoryPage";
import { RegisterItem } from "@/pages/RegisterItem";
import { ReportPage } from "@/pages/ReportPage";
import { AddIndividualDispatchPage } from "./pages/DispatchIndividualItems";
import { ProfilePage } from "@/pages/ProfilePage";
import { AddIndividualItemPage } from "./pages/AddIndividualItems.tsx";

import { SignInPage } from "@/pages/SignInPage.tsx";
import { SignUpPage } from "@/pages/SignUpPage.tsx";

import { RequireAuth } from "@/components/auth/RequireAuth.tsx"
import { useAuth } from "./hooks/useAuth.ts";
import { useAuthStore } from "./stores/authstore.ts";
import { useEffect } from "react";

import { Toaster } from "sonner";

import { initDevice } from "./lib/utils/device.ts";




function AuthProvider({ children }: { children: React.ReactNode }) {
  const loading = useAuthStore((s) => s.loading);
  useAuth() 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B132B]">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>
}



export const App = () => {

  useEffect(()=>{
  initDevice();
},[])

 return(
  <BrowserRouter>
  <AuthProvider>
    <Toaster richColors position="top-right"/>
    <Routes>

     {/*Public routes*/}
        <Route path="/signin" element={<SignInPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
    
     {/*Protected routes*/}
     <Route element={<RequireAuth/>}>
      <Route path="/" element={<AppShell/>}>
        <Route index                 element={<DashBoard/>}/>
        <Route path ="/receive"      element={<ReceiveStockPage/>}/>
        <Route path="/receive/add"   element={<AddIndividualItemPage/>}/>
        <Route path ="/dispatch"     element={<DispatchPage/>}/>
        <Route path="dispatch/add"   element={<AddIndividualDispatchPage />} />
        <Route path="/inventory"     element={<InventoryPage/>}/>
        <Route path="/register"      element={<RegisterItem/>}/>
        <Route path="/report"        element={<ReportPage/>}/>
        <Route path="/profile"       element={<ProfilePage/> }/>
      </Route>
     </Route>

     {/*<Route path="*" element={<NotFoundPage />} />*/}

    </Routes>
    </AuthProvider>
  </BrowserRouter>
 );
};

