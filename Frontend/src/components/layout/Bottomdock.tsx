import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/config/nav";



export const BottomDock = () =>{
    return(
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B2B4B] border-t border-white/10">
            <div className="flex items-center justify-around px-1 py-2 safe-area-bottom">
              {NAV_ITEMS.map(({label ,path ,icon :Icon })=>(
                 <NavLink
                  key={path}
                  to={path}
                  end={path ==="/"}
                  className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-0 flex-1
              ${isActive ? "text-[#0EA5A0]" : "text-white/40 hover:text-white/70"}`
            }
          >
            {({ isActive })=>(
                <>
                <div className="relative">
                    <Icon size={20}/>
                    {isActive && (
                        <span className="absolute-bottom-1 left-1/2-translate-x-1/2 w-1 h-1 rouded-full bg-[#0EA5A0]"/>
                        )}
                </div>
                <span className="text-[9px] font-medium leading-none truncate w-full text-center">
                    {label}
                </span>
                </>
            )}
          </NavLink>
              ))}
            </div>
        </nav>
    );
};