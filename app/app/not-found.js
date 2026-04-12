'use client';

import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-slate-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 text-center max-w-lg">
                <div className="mb-8 relative inline-block">
                    <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20 rotate-12">
                        <ShieldAlert className="h-12 w-12 text-red-500" />
                    </div>
                </div>

                <h1 className="text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                    404
                </h1>
                
                <h2 className="text-2xl font-bold mb-4">Path Securely Restricted</h2>
                
                <p className="text-slate-400 mb-10 leading-relaxed">
                    The requested examination resource or dashboard segment could not be found. 
                    This may be due to an expired session or an invalid routing request.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" /> Go Back
                    </button>
                    
                    <Link href="/" className="flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all">
                        <Home className="h-4 w-4" /> Return Home
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-700 text-[10px] font-mono tracking-widest uppercase">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Unauthorized Access Logged
            </div>
        </div>
    );
}
