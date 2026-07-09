import {Home,PackagePlus,PackageMinus,LayoutGrid,ScanBarcode,BarChart2,User2,type LucideIcon, User,} from "lucide-react"

export interface NavItem {
    label:string;
    path: string;
    icon :LucideIcon;
}

export const NAV_ITEMS :NavItem[] =[
  { label: "Home",           path: "/",           icon: Home        },
  { label: "Receive Stock",  path: "/receive",    icon: PackagePlus },
  { label: "Dispatch",       path: "/dispatch",   icon: PackageMinus},
  { label: "Inventory",      path: "/inventory",  icon: LayoutGrid  },
  { label: "Register Item",  path: "/register",   icon: ScanBarcode },
  { label: "Report",         path: "/report",     icon: BarChart2   },
  /*{ label: "Profile",        path:"/profile",     icon: User2       },*/
]