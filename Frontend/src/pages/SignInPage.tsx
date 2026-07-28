import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from "lucide-react";

export const SignInPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword]   = useState(false);
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [focusedInput, setFocusedInput]   = useState<string | null>(null);

  // 3D card tilt
  const mouseX   = useMotionValue(0);
  const mouseY   = useMotionValue(0);
  const rotateX  = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY  = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: replace with real auth call
    setTimeout(() => { setIsLoading(false); navigate("/"); }, 2000);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0D1B2E] relative overflow-hidden flex items-center justify-center px-4">

      {/* ── Background glows ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0EA5A0]/30 via-[#1B2B4B]/60 to-[#0D1B2E]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] rounded-b-[50%] bg-[#0EA5A0]/15 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] rounded-b-full bg-[#0EA5A0]/10 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70vw] h-[60vh] rounded-t-full bg-[#1B2B4B]/40 blur-[60px]" />

      {/* ── Card ── */}
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
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none z-0">
            {[
              { axis: "left",   from: "-50%", to: "100%", cls: "top-0 left-0 h-[2px] w-[50%]",   bg: "bg-gradient-to-r" },
              { axis: "top",    from: "-50%", to: "100%", cls: "top-0 right-0 h-[50%] w-[2px]",  bg: "bg-gradient-to-b" },
              { axis: "right",  from: "-50%", to: "100%", cls: "bottom-0 right-0 h-[2px] w-[50%]", bg: "bg-gradient-to-l" },
              { axis: "bottom", from: "-50%", to: "100%", cls: "bottom-0 left-0 h-[50%] w-[2px]", bg: "bg-gradient-to-t" },
            ].map((beam, i) => (
              <motion.div
                key={i}
                className={`absolute ${beam.cls} ${beam.bg} from-transparent via-[#0EA5A0] to-transparent opacity-60`}
                animate={{ [Object.keys({left:1,top:1,right:1,bottom:1})[i]]: [beam.from, beam.to] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, delay: i * 0.6 }}
              />
            ))}
          </div>

          {/* Glass card */}
          <div className="relative bg-[#1B2B4B]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.07] shadow-2xl overflow-hidden">

            {/* Subtle grid texture */}
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
              style={{
                backgroundSize: "32px 32px",
              }}
            />

            {/* Logo + heading */}
            <div className="text-center mb-6 space-y-1.5">
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
                Welcome back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-xs"
              >
                Sign in to Jorisa Inventory
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative flex items-center rounded-lg overflow-hidden"
              >
                <Mail size={15} className={`absolute left-3 transition-colors duration-200 text-[#0EA5A0]`} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30
                             focus:outline-none focus:border-[#0EA5A0]/60 focus:bg-white/8 transition-all duration-200"
                />
              </motion.div>

              {/* Password */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative flex items-center rounded-lg overflow-hidden"
              >
                <Lock size={15} className={`absolute left-3 transition-colors duration-200 text-[#0EA5A0] `} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className="w-full h-10 pl-9 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30
                             focus:outline-none focus:border-[#0EA5A0]/60 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#0EA5A0] hover:text-black/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </motion.div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-white/40 hover:text-[#0EA5A0] transition-colors">
                  Forgot password?
                </Link>
              </div>

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
                      Sign In <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Sign up link */}
              <p className="text-center text-xs text-white/40 pt-1">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#0EA5A0] hover:text-white font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};


