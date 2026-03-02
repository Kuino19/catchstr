import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST() {
    try {
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
