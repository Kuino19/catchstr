'use client';
import ProtectedRoute from "@/components/ProtectedRoute";
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';

export default function SocialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex w-full min-h-screen">
                <LeftSidebar />
                <div className="flex-1 flex justify-center border-x border-slate-200 dark:border-slate-800">
                    <main className="max-w-2xl w-full bg-white dark:bg-background-dark min-h-screen overflow-x-hidden">
                        {children}
                    </main>
                </div>
                <RightSidebar />
            </div>
        </ProtectedRoute>
    );
}
