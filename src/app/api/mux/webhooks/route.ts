import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Mux from '@mux/mux-node';
import crypto from 'crypto';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

// You should set this in your .env.local after setting up the webhook in the Mux Dashboard
const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const signature = req.headers.get('mux-signature');

        // Note: For a production app, you MUST verify the webhook signature here using:
        // Mux.Webhooks.verifySignature(JSON.stringify(payload), req.headers, webhookSecret)

        console.log('Received Mux Webhook:', payload.type);

        // When a live stream ends, Mux generates a VOD asset.
        if (payload.type === 'video.asset.ready') {
            const asset = payload.data;

            // If this asset came from a live stream, it will have a live_stream_id
            if (asset.live_stream_id) {
                console.log(`VOD is ready for stream ${asset.live_stream_id}. Asset ID: ${asset.id}`);

                const playbackId = asset.playback_ids?.[0]?.id;

                if (playbackId) {
                    // Find the user who created this stream
                    const { data: activeStream } = await supabase
                        .from('active_streams')
                        .select('user_id')
                        .eq('stream_id', asset.live_stream_id)
                        .single();

                    if (activeStream) {
                        // Insert into our new past_broadcasts table
                        const { error } = await supabase.from('past_broadcasts').insert({
                            user_id: activeStream.user_id,
                            asset_id: asset.id,
                            playback_id: playbackId,
                            duration: asset.duration || 0,
                            created_at: new Date().toISOString()
                        });

                        if (error) {
                            console.error('Error saving past broadcast:', error);
                        } else {
                            console.log(`Successfully saved VOD for user ${activeStream.user_id}`);
                        }
                    } else {
                        console.warn(`Could not find the original active stream for ${asset.live_stream_id}`);
                    }
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
    }
}
