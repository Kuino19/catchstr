'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (signInError) {
            setError(signInError.message);
        } else if (data.session) {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] flex">
            {/* Left Side: Brand & Visuals (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1574629810360-7efbc5381395?q=80&w=2574&auto=format&fit=crop")' }}
                />
                {/* High-end Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />

                {/* Brand Content */}
                <div className="relative z-10 max-w-lg px-12">
                    <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl mb-8 transform -rotate-6">
                        <span className="material-symbols-outlined text-slate-900 text-5xl font-black">sports_soccer</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight mb-6 leading-tight">
                        The ultimate network for <span className="text-primary">football professionals</span>.
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                        Connect with players, agents, and scouts worldwide. Build your portfolio, share highlights, and take your career to the next level.
                    </p>

                    {/* User Avatars Social Proof */}
                    <div className="flex items-center gap-4 mt-12">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <img key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 object-cover" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User avatar" />
                            ))}
                        </div>
                        <p className="text-sm font-bold text-slate-300">Join 10,000+ professionals</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 xl:px-32 py-12 relative z-10 bg-white dark:bg-[#0A0F1A]">

                {/* Mobile Header (Only visible on small screens) */}
                <div className="lg:hidden flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl mb-4">
                        <span className="material-symbols-outlined text-slate-900 text-3xl font-black">sports_soccer</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">catchstr</h1>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Welcome back</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Enter your credentials to access your account.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-500/20 flex items-center gap-3">
                                <span className="material-symbols-outlined shrink-0 text-xl">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                                        placeholder="your@email.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                                    <Link className="text-primary text-sm font-bold hover:underline" href="#">Forgot?</Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                                        placeholder="••••••••"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-primary hover:bg-blue-600 active:bg-blue-700 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            <span className="shrink-0 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-bold text-slate-700 dark:text-slate-300">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-bold text-slate-700 dark:text-slate-300">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05 1.72-3.32 1.72s-1.63-.73-3.41-.73-2.25.71-3.42.71c-1.34 0-2.39-.77-3.48-1.89-2.23-2.29-3.41-6.49-1.12-10.45 1.14-1.96 3.16-3.2 5.36-3.2 1.68 0 2.83.99 3.86.99s2.11-.99 4.03-.99c1.69 0 3.16.81 4.19 2.06-3.6 2.13-3.03 7.35.53 9.07-.63 1.76-1.63 3.46-3.2 4.71zM12.03 7.25c-.21-2.91 2.21-5.5 4.93-5.75.29 2.91-2.48 5.6-4.93 5.75z"></path>
                                </svg>
                                Apple
                            </button>
                        </div>

                        <p className="text-center text-slate-500 dark:text-slate-400 font-medium pt-4">
                            New to Catchstr?
                            <Link href="/register" className="text-primary font-bold hover:underline ml-2">Create account</Link>
                        </p>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-4">
                        <Link href="/legal/privacy" className="hover:text-primary transition-colors hover:underline">Privacy Policy</Link>
                        <span className="w-1 h-1 rounded-full bg-slate-400/50"></span>
                        <Link href="/legal/terms" className="hover:text-primary transition-colors hover:underline">Terms of Service</Link>
                        <span className="w-1 h-1 rounded-full bg-slate-400/50"></span>
                        <Link href="#" className="hover:text-primary transition-colors hover:underline">Help Center</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
