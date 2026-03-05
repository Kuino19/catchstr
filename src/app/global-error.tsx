'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Root layout error:', error.digest ?? 'no digest');
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-6">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                        <span style={{ fontSize: 40 }}>⚽</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight mb-2" style={{ fontWeight: 900 }}>Catchstr is having a moment</h1>
                        <p style={{ color: '#64748b', maxWidth: 360 }}>Something went wrong at the root level. Our team has been notified.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={reset} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', fontWeight: 700, borderRadius: 16, border: 'none', cursor: 'pointer' }}>
                            Try again
                        </button>
                        <Link href="/" style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: 16, textDecoration: 'none' }}>
                            Go home
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    );
}
