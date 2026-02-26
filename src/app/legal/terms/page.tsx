import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function TermsOfServicePage() {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center">
                <Link href="/" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mr-4">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Terms of Service</h1>
            </header>

            <main className="px-6 py-8 max-w-2xl mx-auto">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        By accessing or using the catchstr platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
                    </p>

                    <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        catchstr provides a professional networking platform designed specifically for footballers, football agents, clubs, and scouts. The platform facilitates connections, content sharing, and direct messaging between sports professionals.
                    </p>

                    <h2 className="text-xl font-bold mb-4">3. User Conduct</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        You agree to use catchstr only for lawful purposes. You are solely responsible for verifying the professional credentials (such as Agent licensing) of individuals you interact with on the platform. catchstr does not perform background checks or verify FIFA/FA licenses automatically.
                    </p>

                    <h2 className="text-xl font-bold mb-4">4. Content Ownership</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        Users retain ownership of all highlight videos, images, and text content they upload. By posting content on catchstr, you grant us a worldwide, non-exclusive license to display, distribute, and promote your content within the platform.
                    </p>

                    <h2 className="text-xl font-bold mb-4">5. Account Termination</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        We reserve the right to suspend or terminate accounts that violate our terms, impersonate official entities, or engage in abusive behavior toward other members of the football community.
                    </p>

                    <p className="text-sm text-slate-500 mt-12 italic">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
