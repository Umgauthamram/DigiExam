import Link from 'next/link';
import { Shield, ArrowRight, Lock, BookOpen, Zap, User, Menu } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-800/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-800/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-50 p-6 md:p-10 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">DigiExam</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login">
            <button className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-full transition-all text-sm font-medium group">
              <User className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
              <span>Portal Login</span>
            </button>
          </Link>
          <button className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-start justify-center min-h-[80vh] px-6 md:px-10 max-w-7xl mx-auto">

        <div className="max-w-4xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <Zap className="w-3 h-3 fill-current" />
            <span>Next-Gen Examination Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
            Your secure <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient-x">
              + intelligent
            </span> <br />
            assessment.
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed border-l-2 border-purple-500/50 pl-6">
            Designed for high-stakes environments. AI-monitored integrity,
            instant grading, and comprehensive analytics for the modern institution.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/login">
              <button className="bg-[#ccff00] hover:bg-[#b0db00] text-black px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center gap-2">
                Start Exam <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/admin/dashboard">
              <button className="bg-transparent border border-white/20 hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2">
                Admin Console
              </button>
            </Link>
          </div>
        </div>

        {/* Floating Abstract Element (Decoration) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-full blur-3xl opacity-50 pointer-events-none -z-10 mix-blend-screen"></div>

        {/* Feature Cards Grid (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <FeatureCard
            icon={Shield}
            title="SecureLock Protocol"
            desc="Full-screen enforcement preventing tab switches."
            color="text-green-400"
            bg="bg-green-400/10"
          />
          <FeatureCard
            icon={BookOpen}
            title="Instant Results"
            desc="Automated grading with detailed performance reports."
            color="text-blue-400"
            bg="bg-blue-400/10"
          />
          <FeatureCard
            icon={User}
            title="Identity Verification"
            desc="AI-powered candidate verification and monitoring."
            color="text-purple-400"
            bg="bg-purple-400/10"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 p-8 text-center text-slate-600 text-sm mt-12 bg-black/50 backdrop-blur-xl">
        <p>&copy; 2026 DigiExam Platform. Secure Internal System.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color, bg }) {
  return (
    <div className="group bg-zinc-900/40 hover:bg-zinc-900/60 backdrop-blur-sm border border-white/5 hover:border-white/10 p-8 rounded-3xl transition-all hover:translate-y-[-5px]">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${bg} border border-white/5 group-hover:scale-110 transition-transform`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <h3 className="font-bold text-xl mb-3 text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
