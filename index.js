import express from 'express';
import { exec } from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

// FIX 1: Use __dirname
const DOWNLOAD_DIR = '/tmp';

const HTML_TEMPLATE = () => `
<!DOCTYPE html>
<html>
<head>
    <title>Wonder Downloader JS</title>
    <style>
        body { background:#0a0a12; color:white; text-align:center; font-family: sans-serif; padding-top:50px; }
        .card { display:inline-block; background:#161625; padding:30px; border-radius:15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        input { padding:12px; width:280px; border-radius:5px; border:none; margin-bottom: 10px; color: black; }
        button { background:#00c853; color:white; border:none; padding:12px 25px; cursor:pointer; border-radius:5px; font-weight:bold; }
        .loader { display: none; border: 4px solid #f3f3f3; border-top: 4px solid #00c853; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>WONDER DOWNLOADER (JS)</h2>
        <form id="dl-form" method="POST" action="/download">
            <input type="text" name="url" placeholder="Paste TikTok link" required>
            <br>
            <button type="submit" id="btn">Download Video</button>
        </form>
        <div id="loading-area">
            <div class="loader" id="spinner"></div>
            <p id="msg" class="hidden">Processing TikTok video... This may take a moment.</p>
        </div>
    </div>
    <script>
        document.getElementById('dl-form').onsubmit = function() {
            document.getElementById('btn').classList.add('hidden');
            document.getElementById('spinner').style.display = 'block';
            document.getElementById('msg').classList.remove('hidden');
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(HTML_TEMPLATE());
});

app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;
    if (!videoUrl) return res.status(400).send('URL is required');

    const fileName = `${uuidv4()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, fileName);

    try {
        // FIX 2: yt-dlp options often require specific flags for TikTok
        await exec(videoUrl, {
            output: filePath,
            format: 'bestvideo+bestaudio/best',
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        });

        res.download(filePath, 'tiktok-video.mp4', (err) => {
            // FIX 3: Always cleanup, even if download was aborted by user
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

    } catch (error) {
        console.error("YT-DLP Error:", error);
        res.status(500).send('Failed to download video. Make sure the URL is valid and yt-dlp is installed.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
