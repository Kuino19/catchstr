'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const publicRoutes = ['/login', '/register'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!mounted) return;

            if (!session && !publicRoutes.includes(pathname)) {
                router.push('/login');
            } else if (session && publicRoutes.includes(pathname)) {
                router.push('/');
            } else {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session && !publicRoutes.includes(pathname)) {
                    router.push('/login');
                } else if (session && publicRoutes.includes(pathname)) {
                    router.push('/');
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    // During SSR, render a stable skeleton to match client expectations
    if (!isMounted) {
        return <div suppressHydrationWarning={true} className="min-h-screen bg-background-light dark:bg-background-dark" />;
    }

    if (isLoading) {
        return (
            <div suppressHydrationWarning={true} className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
