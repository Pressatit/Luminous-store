import { BrowserRouter ,Route ,Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/Homepage"
import { ReceiveStock } from "@/pages/ReceiveStock";
import { DispatchItems} from "@/pages/DispatchItems";
import { InventoryPage } from "@/pages/InventoryPage";
import { RegisterItem } from "@/pages/RegisterItem";
import { ReportPage } from "@/pages/ReportPage";
import { ProfilePage } from "@/pages/ProfilePage";

export const App = () => {
 return(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppShell/>}>
        <Route index                 element={<HomePage/>}/>
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

