'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
            router.refresh(); // Refresh to apply any layout or auth state changes
        }
    };

    return (
        <form onSubmit={handleLogin} className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <div className="flex items-center p-6 justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-background-dark text-4xl font-bold">sports_soccer</span>
                    </div>
                    <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight tracking-tight">catchstr</h1>
                </div>
            </div>

            <div className="@container px-6 py-4">
                <div
                    className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-[200px] shadow-sm"
                    aria-label="Professional football field at night with stadium lights"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBoeHayAnQlhfV5pSnfqfBKk_8ypwTHnV02PwmNEx_Ht3DBGr-Lx9q3BokCQ0mYBWxjkvFpooeuYdyRGhdMheAmoAjhChsqu4CgTl6l086V7HIlzKUFc-a-GCQ-LifVqSpOxAqOXmnc4VxXe45m7NIiTTdJdC69zj2ShkL7Xczc7P2cTGPYOM3HGyuUEb3FGAO8ulLV31Y9h3ue4_L2wkQO-Q5H3lzbKR1O6UAFpv1M8JJj0cHailU4otpH6W2zc4JZomkq3_2BoJPa")' }}
                >
                </div>
            </div>

            <div className="flex flex-col gap-6 px-6 py-4">
                <div className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800/50">
                            {error}
                        </div>
                    )}
                    <label className="flex flex-col">
                        <p className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-2 ml-1">Email</p>
                        <input
                            className="form-input flex w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-primary/20 h-14 placeholder:text-slate-400 p-4 text-base font-normal transition-all"
                            placeholder="your@email.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </label>
                    <label className="flex flex-col">
                        <p className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-2 ml-1">Password</p>
                        <div className="relative flex w-full">
                            <input
                                className="form-input flex w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-primary/20 h-14 placeholder:text-slate-400 p-4 pr-12 text-base font-normal transition-all"
                                placeholder="Enter your password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <div
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="material-symbols-outlined">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </div>
                        </div>
                    </label>
                    <div className="flex justify-end">
                        <Link className="text-primary text-sm font-semibold hover:opacity-80 transition-opacity" href="#">Forgot Password?</Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 text-lg font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <div className="relative py-4">
                    <div aria-hidden="true" className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm font-medium leading-6">
                        <span className="bg-background-light dark:bg-background-dark px-4 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="flex justify-center gap-6">
                    <button type="button" className="flex items-center justify-center w-14 h-14 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                    </button>
                    <button type="button" className="flex items-center justify-center w-14 h-14 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05 1.72-3.32 1.72s-1.63-.73-3.41-.73-2.25.71-3.42.71c-1.34 0-2.39-.77-3.48-1.89-2.23-2.29-3.41-6.49-1.12-10.45 1.14-1.96 3.16-3.2 5.36-3.2 1.68 0 2.83.99 3.86.99s2.11-.99 4.03-.99c1.69 0 3.16.81 4.19 2.06-3.6 2.13-3.03 7.35.53 9.07-.63 1.76-1.63 3.46-3.22 4.71zM12.03 7.25c-.21-2.91 2.21-5.5 4.93-5.75.29 2.91-2.48 5.6-4.93 5.75z"></path>
                        </svg>
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Don't have an account?
                        <Link className="text-primary font-bold hover:underline ml-1" href="/register">Register</Link>
                    </p>
                </div>
            </div>

            <div className="mt-auto pb-8 flex flex-col items-center gap-2 opacity-60">
                <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <Link href="#">Privacy Policy</Link>
                    <span>•</span>
                    <Link href="#">Terms of Service</Link>
                </div>
            </div>
        </form>
    );
}
