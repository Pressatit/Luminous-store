import { BrowserRouter ,Route ,Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashBoard } from "./pages/DashBoard.tsx";
import { ReceiveStock } from "@/pages/ReceiveStock";
import { DispatchItems} from "@/pages/DispatchItems";
import { InventoryPage } from "@/pages/InventoryPage";
import { RegisterItem } from "@/pages/RegisterItem";
import { ReportPage } from "@/pages/ReportPage";
import { ProfilePage } from "@/pages/ProfilePage";

import { SignInPage } from "@/pages/SignInPage.tsx";
import { SignUpPage } from "@/pages/SignUpPage.tsx";


export const App = () => {
 return(
  <BrowserRouter>
    <Routes>
      
        <Route path="/signin" element={<SignInPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
    
      <Route path="/" element={<AppShell/>}>
        <Route index                 element={<DashBoard/>}/>
        <Route path ="/receive"      element={<ReceiveStock/>}/>
        <Route path ="/dispatch"     element={<DispatchItems/>}/>
        <Route path="/inventory"     element={<InventoryPage/>}/>
        <Route path="/register"      element={<RegisterItem/>}/>
        <Route path="/report"        element={<ReportPage/>}/>
        <Route path="/profile"       element={<ProfilePage/> }/>
      </Route>
    </Routes>
  </BrowserRouter>
 );
};

