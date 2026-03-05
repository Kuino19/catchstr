'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin route error:', error.digest ?? 'no digest');
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-6 text-center gap-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-4xl">shield_question</span>
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-2">Admin Error</h1>
                <p className="text-slate-400 max-w-sm">
                    An unexpected error occurred in the admin panel.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-blue-600 transition-colors"
                >
                    Try again
                </button>
                <Link href="/" className="px-6 py-3 bg-white/5 text-slate-300 font-bold rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                    Back to site
                </Link>
            </div>
        </div>
    );
}
