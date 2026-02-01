import express from 'express';
import { exec } from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.urlencoded({ extended: true }));

const DOWNLOAD_DIR = '/tmp'; 

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <title>Wonder Downloader</title>
    <style>
        body { background: #00ff00; color: white; text-align: center; font-family: sans-serif; padding-top: 50px; }
        .card { display: inline-block; background: #161625; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        input { padding: 12px; width: 280px; border-radius: 5px; border: none; margin-bottom: 10px; color: black; }
        button { background: #00c853; color: white; border: none; padding: 12px 25px; cursor: pointer; border-radius: 5px; font-weight: bold; }
        .loader { display: none; border: 4px solid #f3f3f3; border-top: 4px solid #ff00ff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>WONDER DOWNLOADER</h2>
        <form id="dl-form" method="POST" action="/download">
            <input type="text" name="url" placeholder="Paste TikTok link" required><br>
            <button type="submit" id="btn">Download Video</button>
        </form>
        <div class="loader" id="spinner"></div>
    </div>
    <script>
        document.getElementById('dl-form').onsubmit = function() {
            document.getElementById('btn').style.display = 'none';
            document.getElementById('spinner').style.display = 'block';
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(HTML_TEMPLATE));

app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;
    const fileName = `${uuidv4()}.mp4`;
    const filePath = path.join(DOWNLOAD_DIR, fileName);

    try {
        await exec(videoUrl, {
            output: filePath,
            format: 'best',
            binaryPath: process.env.YTP_PATH || './node_modules/yt-dlp-exec/bin/yt-dlp'
        });

        res.download(filePath, 'video.mp4', (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Live'));

export default app;
