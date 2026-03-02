import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased pb-24 min-h-screen">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center">
                <Link href="/" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mr-4">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Privacy Policy</h1>
            </header>

            <main className="px-6 py-8 max-w-2xl mx-auto">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        At catchstr, we collect information you provide directly to us when you create an account, update your profile, upload content (like videos and images), or communicate with other users via our messaging system. This includes your name, email address, role (Player/Agent), location, and any networking messages sent.
                    </p>

                    <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        We use the information we collect to operate, maintain, and provide the features and functionality of the Service. We use your data to populate your public profile that allows players to be scouted and for networking connections to be made.
                    </p>

                    <h2 className="text-xl font-bold mb-4">3. Data Sharing</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users.
                    </p>

                    <h2 className="text-xl font-bold mb-4">4. Security of Data</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        Our platform is powered by highly secure database architectures (Supabase) that utilize Row Level Security (RLS) algorithms ensuring your private direct messages remain entirely encrypted and inaccessible by external actors or unauthorized network peers.
                    </p>

                    <h2 className="text-xl font-bold mb-4">5. Your Rights</h2>
                    <p className="mb-6 text-slate-600 dark:text-slate-400">
                        You have the right to access, update, or delete your personal information at any time by navigating to your Profile settings. By deleting your account, all associated Posts, Follows, and Messages will be securely wiped from our servers upon automated trigger cascading.
                    </p>

                    <p className="text-sm text-slate-500 mt-12 italic">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </main>
        </div>
    );
}
