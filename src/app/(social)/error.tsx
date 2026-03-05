'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SocialError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for monitoring (e.g., Sentry in future)
        console.error('Social route error:', error.digest ?? 'no digest');
    }, [error]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-6 text-center gap-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Something went wrong</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    We hit an unexpected error. Try refreshing the page or come back shortly.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-blue-600 transition-colors"
                >
                    Try again
                </button>
                <Link href="/" className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Go home
                </Link>
            </div>
        </div>
    );
}
