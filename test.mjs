import fs from 'fs';
import Mux from '@mux/mux-node';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function main() {
    try {
        const stream = await mux.video.liveStreams.create({
            playback_policy: ['public'],
            new_asset_settings: { playback_policy: ['public'] },
            generated_subtitles: [
                {
                    name: 'English',
                    passthrough: 'English',
                    language_code: 'en'
                }
            ]
        });
        console.log("Success:", stream.id);
    } catch (e) {
        console.error("Mux Error:");
        console.error(JSON.stringify(e, null, 2));
    }
}

main();
