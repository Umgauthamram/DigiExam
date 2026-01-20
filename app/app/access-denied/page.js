import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-red-500/10 p-6 rounded-full mb-6">
                <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-400 max-w-md mb-8">
                You do not have permission to view this page. If you believe this is an error, please contact the IT Cell.
            </p>
            <Link
                href="/login"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700"
            >
                Return to Login
            </Link>
        </div>
    );
}
