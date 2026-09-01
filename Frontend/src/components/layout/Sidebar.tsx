import { NavLink } from "react-router-dom";
import { LogOut,Zap } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { useAuthStore } from "@/stores/authstore";

interface SidebarProps{
    userName : string;
    userRole : string;
}

export const Sidebar =() =>{

    const user =useAuthStore((s)=>s.user);
    const userName =user?.name
    const userRole=user?.role
    const logout =useAuthStore((s)=>s.logout);


    return(
        <aside className="hidden md:flex flex-col w-64 h-screen bg-[#1B2B4B] text-white fixed left-0 top-0 z-40">
         {/*Brand*/}
         <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-[#0EA5A0] flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-white truncate">Luminous</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Electrical & Hardware</p>
            </div>
         </div>
         <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(({label, path, icon:Icon })=>(
                <NavLink
                 key={path}
                 to={path}
                 end={path === "/"}
                 className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                    ${isActive
                       ? "bg-[#0EA5A0]/15 text-[#0EA5A0]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                     }`
                   }
                >
                {({ isActive })=>(
                    <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#0EA5A0] rounded-r-full" />
                    )}
                    <Icon size={18} className="flex-shrink-0"/>
                    <span>{label}</span>
                    </>
                )}
            </NavLink>
            ))}
         </nav>
         
        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#0EA5A0]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0EA5A0] text-xs font-bold uppercase">
                        {user?.name.charAt(0)}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-white/40 capitalize"> {userRole}</p>
                </div>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all" >
            <LogOut size={14}> </LogOut> Sign Out
            </button>
        </div>
        </aside>
    );
};