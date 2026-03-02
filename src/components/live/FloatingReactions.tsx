'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart } from 'lucide-react';

interface Reaction {
    id: string;
    emoji: string;
    xOffset: number;
}

export default function FloatingReactions({ streamId, isBroadcaster = false }: { streamId: string, isBroadcaster?: boolean }) {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        // Subscribe to broadcast events
        const ch = supabase.channel(`reactions_${streamId}`, {
            config: {
                broadcast: { ack: false }
            }
        });

        ch.on('broadcast', { event: 'reaction' }, (payload) => {
            addReaction(payload.payload.emoji);
        }).subscribe();

        setChannel(ch);

        return () => {
            supabase.removeChannel(ch);
        };
    }, [streamId]);

    const [showGifts, setShowGifts] = useState(false);

    const addReaction = useCallback((emoji: string) => {
        const id = Math.random().toString(36).substring(7);
        // Random horizontal offset between -30px and 30px
        const xOffset = Math.random() * 60 - 30;

        setReactions(prev => [...prev, { id, emoji, xOffset }]);

        // Remove reaction after animation completes (2s)
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);
    }, []);

    const sendReaction = async (emoji: string = '❤️') => {
        addReaction(emoji); // Show instantly for sender

        if (channel) {
            await channel.send({
                type: 'broadcast',
                event: 'reaction',
                payload: { emoji }
            });
        }
    };

    // Virtual gifts configuration
    const VIRTUAL_GIFTS = [
        { id: 'rose', emoji: '🌹', cost: 10, name: 'Rose' },
        { id: 'fire', emoji: '🔥', cost: 50, name: 'Fire' },
        { id: 'soccer', emoji: '⚽', cost: 100, name: 'Goal' },
        { id: 'trophy', emoji: '🏆', cost: 500, name: 'Trophy' },
        { id: 'crown', emoji: '👑', cost: 1000, name: 'Crown' }
    ];

    const sendGift = async (gift: any) => {
        // Optimistic UI update
        sendReaction(gift.emoji);
        setShowGifts(false);

        // In a real implementation we would call a secure Edge Function here:
        // await supabase.functions.invoke('send-virtual-gift', { body: { receiverId: ..., amount: gift.cost, giftId: gift.id } })

        console.log(`Sending gift: ${gift.name} costing ${gift.cost} coins`);
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {/* The Floating Animation Area */}
            <div className="absolute bottom-24 right-10 w-20 h-64 pointer-events-none">
                {reactions.map((reaction) => (
                    <div
                        key={reaction.id}
                        className="absolute bottom-0 text-[32px]"
                        style={{
                            left: `calc(50% + ${reaction.xOffset}px)`,
                            animation: 'floatUp 2s ease-out forwards'
                        }}
                    >
                        {reaction.emoji}
                    </div>
                ))}
            </div>

            {/* The Reaction & Gifting Buttons */}
            {!isBroadcaster && (
                <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-2">
                    {/* Gift Menu */}
                    {showGifts && (
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl mb-2 flex gap-2 animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                            {VIRTUAL_GIFTS.map(gift => (
                                <button
                                    key={gift.id}
                                    onClick={() => sendGift(gift)}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-colors group min-w-[60px]"
                                    title={`Send ${gift.name} (${gift.cost} coins)`}
                                >
                                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">{gift.emoji}</span>
                                    <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[10px] filled">monetization_on</span>
                                        {gift.cost}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowGifts(!showGifts)}
                            className={`w-12 h-12 ${showGifts ? 'bg-primary/90' : 'bg-black/60'} hover:bg-primary backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-all active:scale-90`}
                            title="Send Gift"
                        >
                            <span className="material-symbols-outlined text-white text-[22px]">redeem</span>
                        </button>
                        <button
                            onClick={() => sendReaction('❤️')}
                            className="w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-transform active:scale-90 group"
                            title="Send Heart"
                        >
                            <Heart className="w-6 h-6 text-white group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
