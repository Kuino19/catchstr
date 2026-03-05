import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { createClient } from '@supabase/supabase-js';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Verify the caller is an authenticated user
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate the token by creating a user-scoped Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stream = await mux.video.liveStreams.create({
            playback_policy: ['public'],
            new_asset_settings: { playback_policy: ['public'] }
        });

        // The WHIP URL for WebRTC ingestion uses the stream key
        const whipUrl = `https://global-live.mux.com/whip/${stream.stream_key}`;

        return NextResponse.json({
            stream,
            webrtc_url: whipUrl
        });
    } catch (error) {
        console.error('Error creating live stream:', error);
        return NextResponse.json({ error: 'Failed to create live stream' }, { status: 500 });
    }
}
