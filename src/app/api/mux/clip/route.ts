import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { supabaseAdmin } from '@/lib/admin';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
    try {
        const { streamId, userId, startTime, endTime } = await req.json();

        if (!streamId || !userId) {
            return NextResponse.json({ error: 'Missing streamId or userId' }, { status: 400 });
        }

        // 1. Get the Live Stream details to find its active Asset ID
        const stream = await mux.video.liveStreams.retrieve(streamId);
        const assetId = stream.active_asset_id;

        if (!assetId) {
            return NextResponse.json({ error: 'No active asset found for this stream. Ensure the stream is live.' }, { status: 400 });
        }

        // 2. Instruct Mux to create a clip (new asset) from the live asset
        // If startTime and endTime aren't provided, default to the last 30 seconds
        const clipSettings: any = {
            input: [{
                url: `mux://assets/${assetId}`,
            }],
            playback_policy: ['public'],
        };

        if (startTime !== undefined && endTime !== undefined) {
            clipSettings.input[0].start_time = startTime;
            clipSettings.input[0].end_time = endTime;
        } else {
            // Get current stream duration
            const asset = await mux.video.assets.retrieve(assetId);
            const duration = asset.duration || 0;
            if (duration > 30) {
                clipSettings.input[0].start_time = duration - 30;
                clipSettings.input[0].end_time = duration;
            }
        }

        const clip = await mux.video.assets.create(clipSettings);

        // 3. Save the clip record to our database (as a post/highlight)
        const playbackId = clip.playback_ids?.[0]?.id;
        if (playbackId) {
            const { error } = await supabaseAdmin.from('posts').insert({
                author_id: userId,
                content: 'Check out this live clip!',
                media_url: playbackId, // Store the playback ID instead of a direct URL
                is_mux_asset: true // Useful flag if they mix Mux and Supabase Storage videos
            });
            if (error) console.error("Error saving clip to DB:", error);
        }

        return NextResponse.json({ success: true, clip });
    } catch (error: any) {
        console.error('Error creating clip:', error);
        return NextResponse.json({ error: error.message || 'Failed to create clip' }, { status: 500 });
    }
}
