const axios = require('axios');

async function testInfo() {
  try {
    const res = await axios.post('http://localhost:5000/api/video/info', { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" });
    console.log(JSON.stringify(res.data.formats, null, 2));
  } catch(e) { console.error(e.message); }
}
testInfo();
