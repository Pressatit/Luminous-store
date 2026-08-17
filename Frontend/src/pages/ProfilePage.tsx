import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authstore";
import { User, Mail, Shield, UserMinus, UserPlus, BookOpen, FileSpreadsheet, LogOut } from "lucide-react";
import { toast } from "sonner";


export const ProfilePage = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/signin");
  };

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1B2B4B] mb-6 text-center">Profile</h1>

      <div className="space-y-6">
        {/* Personal Information Card */}
        <div>
          <h2 className="text-sm font-semibold text-[#1B2B4B]/70 mb-2">Personal information</h2>
          <div className="bg-[#E5E7EB]/50 rounded-2xl p-6 border border-gray-200/60 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#0EA5A0]" />
              <p className="text-sm text-[#1B2B4B]">
                <span className="font-semibold">Name: </span>
                {user?.name || "N/A"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#0EA5A0]" />
              <p className="text-sm text-[#1B2B4B]">
                <span className="font-semibold">Email: </span>
                {user?.email || "N/A"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#0EA5A0]" />
              <p className="text-sm text-[#1B2B4B]">
                <span className="font-semibold">Role: </span>
                <span className="font-bold capitalize text-[#1B2B4B]">{user?.role || "Cashier"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card (Visible only to Admin & Managers) */}
        {isAdminOrManager && (
          <div>
            <h2 className="text-sm font-semibold text-[#1B2B4B]/70 mb-2">Quick Actions</h2>
            <div className="bg-[#E5E7EB]/50 rounded-2xl p-6 border border-gray-200/60 shadow-sm space-y-3">
              <button
                onClick={() => toast.info("Delete employee feature coming soon")}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1B2B4B] rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-all shadow-sm w-full sm:w-auto"
              >
                <UserMinus className="w-4 h-4 text-red-500" />
                Delete employee
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1B2B4B] rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-all shadow-sm w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 text-[#0EA5A0]" />
                Register employee
              </button>

              <button
                onClick={() => navigate("/inventory")}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1B2B4B] rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-all shadow-sm w-full sm:w-auto"
              >
                <BookOpen className="w-4 h-4 text-[#0EA5A0]" />
                View catalogue
              </button>

              <button
                onClick={() => navigate("/report")}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1B2B4B] rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-all shadow-sm w-full sm:w-auto"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0EA5A0]" />
                Request report
              </button>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0B132B] text-white rounded-xl text-sm font-semibold hover:bg-[#1B2B4B] transition-all shadow-md active:scale-95"
          >
            <LogOut className="w-4 h-4 text-[#0EA5A0]" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};