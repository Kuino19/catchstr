'use client';

import { useState } from 'react';
import { Scissors } from 'lucide-react';

export default function ClipButton({ streamId, currentUserId }: { streamId: string, currentUserId: string }) {
    const [isClipping, setIsClipping] = useState(false);
    const [justClipped, setJustClipped] = useState(false);

    const handleClip = async () => {
        if (isClipping || justClipped) return;
        setIsClipping(true);

        try {
            const res = await fetch('/api/mux/clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streamId,
                    userId: currentUserId
                })
            });

            if (res.ok) {
                setJustClipped(true);
                setTimeout(() => setJustClipped(false), 5000); // Reset after 5s
            } else {
                console.error('Failed to create clip');
            }
        } catch (error) {
            console.error('Error in clipping request:', error);
        } finally {
            setIsClipping(false);
        }
    };

    return (
        <button
            onClick={handleClip}
            disabled={isClipping || justClipped}
            className={`
                group absolute bottom-10 left-10 z-50
                flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md shadow-xl border
                transition-all active:scale-95
                ${justClipped
                    ? 'bg-green-500/80 text-white border-green-400'
                    : 'bg-black/60 hover:bg-black/80 text-white border-white/10 hover:border-white/30'
                }
            `}
            title="Clip last 30 seconds"
        >
            <Scissors className={`w-5 h-5 ${isClipping ? 'animate-pulse text-primary' : ''}`} />
            <span className="font-bold text-sm tracking-widest uppercase">
                {isClipping ? 'Clipping...' : justClipped ? 'Highlight Saved!' : 'Clip Highlight'}
            </span>
            {!justClipped && <div className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
        </button>
    );
}
