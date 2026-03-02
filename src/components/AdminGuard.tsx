'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function checkAdmin() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();

            if (profile?.is_admin) {
                setIsAdmin(true);
            } else {
                router.push('/');
            }
        }

        checkAdmin();
    }, [router]);

    if (isAdmin === null) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
