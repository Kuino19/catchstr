'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users } from 'lucide-react';

export default function ViewerCount({ streamId }: { streamId: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const channel = supabase.channel(`presence_${streamId}`, {
            config: {
                presence: {
                    key: streamId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                let total = 0;
                for (const key in state) {
                    total += state[key].length;
                }
                setCount(total);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track our own presence
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId]);

    return (
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-white shadow-lg border border-white/10 m-4">
            <Users className="w-4 h-4 text-primary" />
            <span>{count} {count === 1 ? 'Viewer' : 'Viewers'}</span>
        </div>
    );
}
