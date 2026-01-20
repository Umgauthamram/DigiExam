import Link from 'next/link';
import { Shield, ArrowRight, Lock, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-slate-800 p-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">DigiExam <span className="text-slate-500 text-sm font-normal">Secure Protocol</span></span>
        </div>
        <Link href="/login">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            Portal Login
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-5xl mx-auto space-y-12">
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-500/20">
            <Lock className="h-3 w-3" /> Official Police Academy Testing Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Advanced Internal <br /> Examination System
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Secure, encrypted, and AI-monitored evaluation platform for cadets.
            Designed to ensure integrity and rapid assessment for the modern force.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <FeatureCard
            icon={Shield}
            title="Secure Environment"
            desc="Full-screen enforcement and tab-switch detection to prevent malpractice during exams."
          />
          <FeatureCard
            icon={BookOpen}
            title="Instant Grading"
            desc="Automated evaluation logic with immediate feedback and score reporting."
          />
          <FeatureCard
            icon={ArrowRight}
            title="AI Analysis"
            desc="Smart insights into cadet performance with remediation suggestions."
          />
        </div>

        <div className="pt-8">
          <Link href="/login">
            <button className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-200 font-bold text-lg flex items-center gap-2 transition-all">
              Access System <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 p-8 text-center text-slate-500 text-sm">
        &copy; 2026 DigiExam Platform. Internal Use Only.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-6 rounded-2xl transition-colors">
      <div className="bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-slate-700">
        <Icon className="h-6 w-6 text-blue-500" />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
