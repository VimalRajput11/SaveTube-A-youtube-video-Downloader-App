const ytDlp = require('yt-dlp-exec');

async function test(clientString) {
    try {
        const rawData = await ytDlp('https://www.youtube.com/watch?v=aqz-KE-bpKQ', {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            noPlaylist: true,
            flatPlaylist: true,
            extractorArgs: `youtube:player_client=${clientString}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });

        const formats = rawData.formats || [];
        const heights = [...new Set(formats.map(f => f.height).filter(h => h))].sort((a,b) => b-a);
        console.log(`${clientString} heights:`, heights.slice(0, 5));
    } catch (e) {
        console.log(`${clientString} error:`, e.stderr ? e.stderr.split('\n')[0] : e.message);
    }
}

async function run() {
    await test('tv_embedded');
    await test('android_vr');
    await test('tv_embedded,android');
    await test('mweb');
}
run();
