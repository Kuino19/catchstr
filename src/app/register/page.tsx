'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'Player' | 'Agent'>('Player');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [successSent, setSuccessSent] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!agreed) {
            setError('You must agree to the Terms of Service and Privacy Policy.');
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        });

        setLoading(false);

        if (signUpError) {
            setError(signUpError.message);
        } else {
            if (data.session) {
                router.push('/');
            } else {
                // In Supabase, if email confirmation is enabled, session will be null here
                setSuccessSent(true);
            }
        }
    };

    if (successSent) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center max-w-[480px] mx-auto bg-background-light dark:bg-background-dark p-6 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-5xl">mark_email_unread</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Check your inbox!</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm">
                    We've sent a verification link to <br /><span className="font-bold text-slate-900 dark:text-white">{email}</span>. <br /><br />Please click the secure link to activate your catchstr profile and start networking.
                </p>
                <Link href="/login" className="flex w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 h-14 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleRegister} className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[480px] mx-auto bg-background-light dark:bg-background-dark">
            {/* Header / Top Bar */}
            <div className="flex items-center p-4 pb-2 justify-between">
                <Link href="/login" className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                </Link>
                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Create Account</h2>
            </div>

            {/* Hero Text */}
            <div className="px-4 pt-8 pb-4">
                <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-[36px] font-bold leading-tight">Join catchstr</h1>
                <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal mt-2">The football networking platform for players and agents.</p>
            </div>

            {/* Registration Form */}
            <div className="flex flex-col gap-4 px-4 py-3">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800/50">
                        {error}
                    </div>
                )}

                {/* Full Name */}
                <label className="flex flex-col">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">Full Name</p>
                    <input
                        className="form-input flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary h-14 placeholder:text-slate-400 p-[15px] text-base font-normal transition-all"
                        placeholder="Cristiano Ronaldo"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                    />
                </label>

                {/* Email */}
                <label className="flex flex-col">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">Email</p>
                    <input
                        className="form-input flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary h-14 placeholder:text-slate-400 p-[15px] text-base font-normal transition-all"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </label>

                {/* Role Selector (Segmented Control) */}
                <div className="flex flex-col mt-2">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-3">I am a...</p>
                    <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl h-14">
                        <button
                            type="button"
                            onClick={() => setRole('Player')}
                            disabled={loading}
                            className={`flex-1 rounded-lg font-semibold text-sm transition-all ${role === 'Player' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                        >
                            Player
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('Agent')}
                            disabled={loading}
                            className={`flex-1 rounded-lg font-semibold text-sm transition-all ${role === 'Agent' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                        >
                            Agent
                        </button>
                    </div>
                </div>

                {/* Password */}
                <label className="flex flex-col">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">Password</p>
                    <div className="relative">
                        <input
                            className="form-input flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary h-14 placeholder:text-slate-400 p-[15px] text-base font-normal pr-12 transition-all"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="material-symbols-outlined absolute right-4 top-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </div>
                </label>

                {/* Confirm Password */}
                <label className="flex flex-col">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">Confirm Password</p>
                    <input
                        className="form-input flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary h-14 placeholder:text-slate-400 p-[15px] text-base font-normal transition-all"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                    />
                </label>

                {/* Terms Agreement */}
                <div className="flex items-center gap-3 py-2">
                    <input
                        className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        id="terms"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        disabled={loading}
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-400 leading-tight" htmlFor="terms">
                        I agree to the <span className="text-slate-900 dark:text-slate-200 font-semibold underline cursor-pointer">Terms of Service</span> and <span className="text-slate-900 dark:text-slate-200 font-semibold underline cursor-pointer">Privacy Policy</span>.
                    </label>
                </div>

                {/* Primary Action Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-primary h-14 text-slate-900 font-bold text-lg shadow-lg active:scale-[0.98] transition-all hover:bg-primary/90 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </div>

                {/* Login Link */}
                <div className="flex justify-center py-6">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Already have an account?
                        <Link className="text-slate-900 dark:text-slate-100 font-bold ml-1 hover:underline" href="/login">Login</Link>
                    </p>
                </div>
            </div>

            {/* Branding Footer Element */}
            <div className="mt-auto flex justify-center pb-8 opacity-20 grayscale">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-900 text-lg font-bold">sports_soccer</span>
                    </div>
                    <span className="font-bold text-xl tracking-tighter">catchstr</span>
                </div>
            </div>
        </form>
    );
}
