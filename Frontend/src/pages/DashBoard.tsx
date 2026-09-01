import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   AlertTriangle, ArrowLeftRight,
  LayoutGrid, User, Zap,
} from "lucide-react";

import { toast } from "sonner";

import { type DateRange } from "../components/report/DatePicker";

import { StatCard }      from "../components/dashboard/StatCard";
import { StockAlertRow } from "../components/dashboard/StockAlertRow";
import { ActivityRow }   from "../components/dashboard/ActivityRow";
import { QuickActions }  from "../components/dashboard/QuickActions";
import { useAuthStore } from "@/stores/authstore";


const Backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";


import type { DashboardSummary, StockAlert, ActivityItem } from "../types/dashboard";

const today = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};


const formatKsh = (n: number) => "Ksh " + n.toLocaleString("en-KE");


const getLiveTime = () =>
  new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

const getLiveDate = () =>
  new Date().toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

export const DashBoard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const isCashier=user?.role =='cashier'


 const [activities, setActivities] =useState<ActivityItem[]>([])
 const [stock,setStock]            =useState<StockAlert[]>([]);
 const [isloading,setisloading]    =useState(true);
 const [error,setError]            =useState("")
 const [categorycount,setCategorycount]= useState<number>(0)


  const [dateRange, setDateRange] = useState<DateRange>({
    from: yesterday(),
    to:   today(),
  });

  useEffect(()=>{

    setisloading(true)

   const token  = localStorage.getItem("JORISA_TOKEN");
   const fetchActivities=async () =>{
    
    try{
      const res=await fetch(`${Backend}/dashboard/activity?date_from=${dateRange.from}&date_to=${dateRange.to}`,{
        headers: {
            "Authorization":            `Bearer ${token}`,
            "Content-Type":             "application/json",
            "ngrok-skip-browser-warning": "true",
          },
      });
      if (!res.ok) throw new Error("Failed to load activity");

      const data:ActivityItem[]= await res.json();
      setActivities(data)
      
    }
    catch(err){
        console.error(err);
        setError("Could not load activity. Check your connection.");
        toast.error(error)

    }
  }

  const fetchStockAlert = async()=>{
    try{
    const res = await fetch(`${Backend}/dashboard/stock-alert`,{
      headers:{
        "Authorization": `Bearer ${token}`,
        "Content-type": "application/json",
        "ngrok-skip-browser-warning": "true"

      },
    })

    if (!res.ok) throw new Error("Failed to load stock Levels");

    const data:StockAlert[]= await res.json();
    setStock(data)
  }
  catch(err){
    setError("Could not load activity. Check your connection.");
    toast.error(error)
  }
  }
  const fetchCategories =async ()=>{
    try{
      const res = await fetch(`${Backend}/categories/count`,{
        headers:{
          "Authorization": `Bearer ${token}`,
          "Content-type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!res.ok) throw new Error("Failed to load stock Levels");

      const data=await res.json()

      setCategorycount(data)

    }
    catch(err){
      setError("Could not load activity. Check your connection.");
      toast.error(error)

    }
  }
  const loadAllData = async () => {
      setisloading(true);
      setError("");
      
      
      await Promise.all([
        fetchStockAlert(),
        fetchActivities(),
        fetchCategories()
      ]);
      
      setisloading(false);
    };

    loadAllData();
},[])

 const Summary: DashboardSummary = {
  lowStockCount: stock.length,
  todayTransactions: { total: activities.length, 
    in:activities.filter(a => a.transaction_type === 'Receive stock').length, 
    out: activities.filter(a => a.transaction_type === 'Dispatch Items').length },
  totalCategories: categorycount,
  activeCashier: isCashier? user.name : '----',
};

  
  const summary: DashboardSummary = Summary;
  const alerts: StockAlert[]      = stock;
  const activity: ActivityItem[]  = activities;

  const [time, setTime] = useState(getLiveTime());

  useEffect(() => {
    const id = setInterval(() => setTime(getLiveTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  const statGrid = (cols: string) => (
    <div className={`grid ${cols} gap-7`}>
      <StatCard icon={AlertTriangle}  value={summary.lowStockCount}               label="Low stock alert"      bgClass="bg-[#C8A84B]" textClass="text-white" iconBgClass="bg-white/20" />
      <StatCard icon={ArrowLeftRight} value={summary.todayTransactions.total}     label="Today's transactions" bgClass="bg-[#4FC3D4]" textClass="text-white" iconBgClass="bg-white/20"
        subLabel={`IN: ${summary.todayTransactions.in}  ·  OUT: ${summary.todayTransactions.out}`} />
      <StatCard icon={LayoutGrid}     value={summary.totalCategories}             label="Total categories"     bgClass="bg-[#7986CB]" textClass="text-white" iconBgClass="bg-white/20" />
    </div>
  );

  const stockHealth = (
    <div className="space-y-2">
      {alerts.map((a) => <StockAlertRow key={a.id} alert={a} />)}
    </div>
  );

  const recentActivity = (
    <div className="divide-y divide-gray-100">
      {activity.map((a) => <ActivityRow key={a.id} item={a} />)}
    </div>
  );

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="md:hidden w-full">

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0EA5A0] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B2B4B] leading-none">Jorisa</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Electrical & Hardware</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="w-8 h-8 rounded-full bg-[#1B2B4B] flex items-center justify-center"
          >
            <User size={14} className="text-white" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400">
            {getLiveDate()} · <span className="font-semibold text-[#1B2B4B]">{time}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Active cashier: <span className="font-semibold text-[#1B2B4B]">{summary.activeCashier}</span>
          </p>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Overview</p>
        <div className="w-full mb-5">{statGrid("grid-cols-2")}</div>

        <div className="mb-5">
          <p className="text-sm font-bold text-[#1B2B4B] mb-2">Stock Health</p>
          {stockHealth}
        </div>

        <div className="mb-5">
          <p className="text-sm font-bold text-[#1B2B4B] mb-1">Recent Activity</p>
          {recentActivity}
        </div>

        <div className="mb-2">
          <p className="text-sm font-bold text-[#1B2B4B] mb-2">
            Quick Actions <span className="text-[#0EA5A0]">✦</span>
          </p>
          <QuickActions />
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block w-full">

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{getLiveDate()}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              Active cashier: <span className="font-semibold text-[#1B2B4B]">{summary.activeCashier}</span>
            </p>
          </div>
          <p className="text-2xl font-bold text-[#1B2B4B]">{time}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Overview</p>
          {statGrid("grid-cols-3")}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-[#1B2B4B] mb-3">Stock Health</p>
            {stockHealth}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-[#1B2B4B] mb-2">Recent Activity</p>
            {recentActivity}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm font-bold text-[#1B2B4B] mb-3">
            Quick Actions <span className="text-[#0EA5A0]">✦</span>
          </p>
          <QuickActions />
        </div>
      </div>
    </>
  );
};

