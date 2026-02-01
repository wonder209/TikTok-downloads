const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

app.get('/', (req, res) => {
  res.send(`
    <h2>Wonder Downloader</h2>
    <form method="POST" action="/download">
      <input name="url" placeholder="Paste TikTok link" required />
      <button>Download</button>
    </form>
  `);
});

app.post('/download', (req, res) => {
  const url = req.body.url;
  const id = uuidv4();
  const output = path.join(DOWNLOAD_DIR, id + '.mp4');

  const ytdlp = spawn('yt-dlp', [url, '-f', 'best', '-o', output]);

  ytdlp.stderr.on('data', d => console.log(d.toString()));

  ytdlp.on('close', code => {
    if (code !== 0 || !fs.existsSync(output)) {
      return res.status(500).send('Download failed');
    }

    res.download(output, 'video.mp4', () => {
      fs.unlink(output, () => {});
    });
  });
});

app.listen(PORT, () => {
  console.log('🚀 Server running on port ' + PORT);
});
