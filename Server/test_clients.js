const ytDlp = require('yt-dlp-exec');

async function test(clientName) {
    try {
        console.log(`Testing client: ${clientName}`);
        const rawData = await ytDlp('https://www.youtube.com/watch?v=aqz-KE-bpKQ', {
            dumpJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            noPlaylist: true,
            flatPlaylist: true,
            extractorArgs: `youtube:player_client=${clientName}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });

        const formats = rawData.formats || [];
        const heights = [...new Set(formats.map(f => f.height).filter(h => h))].sort((a,b) => b-a);
        console.log(`${clientName} heights:`, heights.slice(0, 5));
    } catch (e) {
        console.log(`${clientName} error:`, e.message.split('\n')[0]);
    }
}

async function run() {
    await test('ios');
    await test('ios,web');
    await test('tv');
    await test('tv,web');
    await test('web_creator');
    await test('default');
    console.log("Done");
}

run();
