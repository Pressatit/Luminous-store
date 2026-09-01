import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, UserKey ,User, ShieldCheck,Store } from "lucide-react";
import { useAuthStore } from "@/stores/authstore";
import { toast } from "sonner";


type Role = "cashier" | "admin" | "manager ";

export const SignUpPage = () => {

  const Backend=import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"


  const navigate = useNavigate();
  const [showPassword, setShowPassword]     = useState(false);
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [role, setRole]                     = useState<Role>("cashier");
  const [storeId,setStoreId]                =  useState<number>(1);
  const [isLoading, setIsLoading]           = useState(false);
  const [focusedInput, setFocusedInput]     = useState<string | null>(null);
  const {setToken,setUser}                  = useAuthStore();
  const [errorMsg,setErrorMsg]              = useState("");              
  

  // 3D card tilt
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

   try {
      const response = await fetch(`${Backend}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email:email, password:password, storeId:Number(storeId) , name:name , role:role }),
      })

      const data = await response.json()

      if (!response.ok) {

       const errorMessage = typeof data.detail === 'string' ? data.detail : 'Account creation failed';

       toast.error(errorMessage);

        throw new Error(data.detail)
        
      }
     
       const userPayload = {
         id: data.user.id,
         name: data.user.name,
         email: data.user.email,
         role: data.user.role,
         storeId: data.user.storeId }

      // Save Token and User payload to browser storage
      localStorage.setItem('JORISA_TOKEN', data.access_token)
      localStorage.setItem('JORISA_USER', JSON.stringify(userPayload))

      // Update Zustand global state immediately
      setToken(data.access_token)
      setUser(userPayload)

      navigate('/')
      toast.success("Logged in successfully")

    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsLoading(false)
    }
  };

  const inputBase =
    "w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0EA5A0]/60 focus:bg-white/8 transition-all duration-200";

  return (
    <div className="min-h-screen w-screen bg-[#0D1B2E] relative overflow-hidden flex items-center justify-center px-4 py-8">

      {/* Background glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0EA5A0]/30 via-[#1B2B4B]/60 to-[#0D1B2E]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] rounded-b-[50%] bg-[#0EA5A0]/15 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] rounded-b-full bg-[#0EA5A0]/10 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          style={{ rotateX, rotateY ,transformStyle: "preserve-3d"}}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative group"
        >
          {/* Traveling border beams */}
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none z-0 ">
            {[
              { cls: "top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r",   animKey: "left",   delay: 0   },
              { cls: "top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b",  animKey: "top",    delay: 0.6 },
              { cls: "bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-l", animKey: "right", delay: 1.2 },
              { cls: "bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-t", animKey: "bottom", delay: 1.8 },
            ].map((b, i) => (
              <motion.div
                key={i}
                className={`absolute ${b.cls} from-transparent via-[#0EA5A0] to-transparent opacity-60`}
                animate={{ [b.animKey]: ["-50%", "100%"] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, delay: b.delay }}
              />
            ))}
          </div>

          {/* Glass card */}
          <div className="relative bg-[#1B2B4B]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.07] shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
              style={{
                
                backgroundSize: "32px 32px",
              }}
            />

            {/* Logo + heading */}
            <div className="text-center mb-5 space-y-1.5">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="mx-auto w-11 h-11 rounded-xl bg-[#0EA5A0] flex items-center justify-center shadow-lg shadow-[#0EA5A0]/30"
              >
                <Zap size={20} className="text-white" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white"
              >
                Create account
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-xs"
              >
                Register a new Jorisa staff account
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Full name */}
              <motion.div whileHover={{ scale: 1.01 }} className="relative flex items-center">
                <User size={15} className={`absolute left-3 transition-colors duration-200 ${focusedInput === "name" ? "text-[#0EA5A0]" : "text-white/30"}`} />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={inputBase}
                />
              </motion.div>

              {/* Email */}
              <motion.div whileHover={{ scale: 1.01 }} className="relative flex items-center">
                <Mail size={15} className={`absolute left-3 transition-colors duration-200 ${focusedInput === "email" ? "text-[#0EA5A0]" : "text-black/30"}`} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={inputBase}
                />
              </motion.div>

              {/* Password */}
              <motion.div whileHover={{ scale: 1.01 }} className="relative flex items-center">
                <Lock size={15} className={`absolute left-3 transition-colors duration-200 ${focusedInput === "password" ? "text-[#0EA5A0]" : "text-black/30"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#0EA5A0] hover:text-black/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </motion.div>

              {/* Store selector */}
              
                <div>
                <p className="text-xs text-white/40 mb-1.5 flex items-center gap-1">
                  <Store size={12} /> Store 
                </p>
                </div>
                <motion.div whileHover={{ scale: 1.01 }} className=" flex items-center mb-1.5 gap-1">
                <UserKey size={12}/>
              <select
                  value={storeId}
                  onChange={(e) => setStoreId(Number(e.target.value))}
                  onFocus={() => setFocusedInput("storeId")}
                  onBlur={() => setFocusedInput(null)}
                  className={`${inputBase} appearance-none cursor-pointer [&>option]:bg-[#1B2B4B] [&>option]:text-[#0EA5A0]`}
                >
                  <option value={1}>Luminous</option>
                  <option value={2}>Jorisa</option>
                  
                </select>
                </motion.div>

              {/* Role selector */}
              
                <div>
                <p className="text-xs text-white/40 mb-1.5 flex items-center gap-1">
                  <ShieldCheck size={12} /> Role
                </p>
                </div>
            <motion.div whileHover={{ scale: 1.01 }} className=" flex items-center mb-1.5 gap-1">
                <UserKey size={12}/>
              <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  onFocus={() => setFocusedInput("role")}
                  onBlur={() => setFocusedInput(null)}
                  className={`${inputBase} appearance-none cursor-pointer [&>option]:bg-[#1B2B4B] [&>option]:text-[#0EA5A0]`}
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </motion.div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 1 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-lg bg-[#0EA5A0] hover:bg-[#0c9490] text-white font-semibold text-sm
                           flex items-center justify-center gap-1.5 transition-colors duration-200
                           shadow-lg shadow-[#0EA5A0]/25 disabled:opacity-70"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      Sign Up <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Sign in link */}
              <p className="text-center text-xs text-white/40 pt-1">
                Already have an account?{" "}
                <Link to="/signin" className="text-[#0EA5A0] hover:text-white font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};


