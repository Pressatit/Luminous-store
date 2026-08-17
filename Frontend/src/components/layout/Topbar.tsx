import { NAV_ITEMS } from "@/config/nav";
import { useLocation , Link} from "react-router-dom";
import {Bell} from "lucide-react"
import { useAuthStore } from "@/stores/authstore";



export const TopBar =()=> {
    const { pathname } =useLocation();
    const user= useAuthStore((s)=>(s.user))

    const current =NAV_ITEMS.find((n)=>
        pathname === "/" ? n.path === "/" : n.path !== "/" && pathname.startsWith(n.path)
    );
    return(
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
            <div className="grid grid-cols-3 items-center px-4 py-3">
                <div>
                    <h1 className="text-base font-bold text-[#1B2B4B] mt-0.5 leading-tight">
                        {current?.label ?? "Profile"}
                    </h1>
                </div>
                <div className="text-center">
                     <p className="text-[15px] text-black-500 uppercase tracking-widest font-semibold">
                        Luminous Electrical & Hardware
                     </p>

                </div>

                <div className="flex items-center justify-end gap-2">
                    <button className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
                       <Bell size={16} className="text-gray-500" />
                       {/* Notification dot to be replaced later with real data */}
                       <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] border-2 border-white"/>
                    </button>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                    <div className="w-9 h-9 rounded-full bg-[#1B2B4B] flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase">
                            {user?.name.charAt(0)}
                        </span>
                    </div>
                    </Link>
                </div>
            </div>
        </header>
    );
};