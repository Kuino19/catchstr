import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Verify the webhook signature to ensure this request is from Mux
        const body = await req.text();
        const signature = req.headers.get('mux-signature') ?? '';
        const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('MUX_WEBHOOK_SECRET is not configured. Rejecting webhook.');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        try {
            mux.webhooks.verifySignature(body, req.headers, webhookSecret);
        } catch (err) {
            console.error('Mux webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(body);
        console.log('Received Mux Webhook:', payload.type);

        // When a live stream ends, Mux generates a VOD asset.
        if (payload.type === 'video.asset.ready') {
            const asset = payload.data;

            // If this asset came from a live stream, it will have a live_stream_id
            if (asset.live_stream_id) {
                console.log(`VOD is ready for stream ${asset.live_stream_id}. Asset ID: ${asset.id}`);

                const playbackId = asset.playback_ids?.[0]?.id;

                if (playbackId) {
                    // Find the user who created this stream (use admin client for reliability)
                    const { data: activeStream } = await supabaseAdmin
                        .from('active_streams')
                        .select('user_id')
                        .eq('stream_id', asset.live_stream_id)
                        .single();

                    if (activeStream) {
                        // Insert into our past_broadcasts table
                        const { error } = await supabaseAdmin.from('past_broadcasts').insert({
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
