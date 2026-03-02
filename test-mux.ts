import { loadEnvConfig } from '@next/env';
import Mux from '@mux/mux-node';

loadEnvConfig(process.cwd());

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
        console.error("Mux Error:", e);
    }
}

main();
