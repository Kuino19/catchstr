const fs = require('fs');
const Mux = require('@mux/mux-node');

const envLocal = fs.readFileSync('.env', 'utf8');
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
    }
});

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function run() {
    try {
        const stream = await mux.video.liveStreams.create({});
        console.log("Success:", stream.id);
    } catch (e) {
        fs.writeFileSync('mux_error.json', JSON.stringify(e.response?.data || e, null, 2));
    }
}
run();
