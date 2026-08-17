import { NAV_ITEMS } from "@/config/nav";
import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/stores/authstore";



export const PageHeader = () =>{
   const {pathname} =useLocation();
   const current= NAV_ITEMS.find((n) =>
    pathname==="/" ? n.path ==="/" : n.path !=="/" && pathname.startsWith(n.path)
    );
   const user = useAuthStore((s)=>(s.user));
   const userName=user?.name
   const userRole=user?.role

   

    return(
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
            <div className="w-full grid grid-cols-3 items-center px-4 py-3" >
            <div>
                <h1 className="text-l  text-[#1B2B4B]">
                   {current?.label ?? "Profile"}
                </h1>
            </div>
            <div className="text-center">
                <p className="text-l text-black-400 uppercase tracking-widest font-semibold mb-0.5">
                    Luminous Electrical & Hardware 
                </p>
            </div>
            <div className="flex items-center justify-end gap-2">
                <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg:gray-100 transition-colors">
                   <Bell size={16} className="text-gray-500"/>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] border-2 border-white" />
        </button>

        <div className="flex items-center gap-2.5">
        <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100">
          <div className="w-9 h-9 rounded-full bg-[#1B2B4B] flex items-center justify-center">
            
            <span className="text-white text-xs font-bold uppercase">
              {user?.name.charAt(0)}
            </span>
           
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-[#1B2B4B] leading-tight">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
          </Link>
        </div>
      </div>
      </div>
    </header>
  );
};