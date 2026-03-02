import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <AlertTriangle className="w-12 h-12 text-slate-400" />
            </div>

            <h1 className="text-4xl font-black uppercase tracking-tight mb-4">404 - Page Not Found</h1>
            <p className="text-slate-500 mb-8 max-w-sm">
                We couldn't find the page you were looking for. The link may be broken or the page may have been removed.
            </p>

            <Link
                href="/"
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-transform hover:-translate-y-1 shadow-lg shadow-primary/30"
            >
                <Home className="w-5 h-5" />
                Back to Feed
            </Link>
        </div>
    );
}
