const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
process.env.FFMPEG_PATH = ffmpegPath;

const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: '/tmp/' });

app.get('/', (req, res) => {
  res.send('OJapp Video Backend (FFmpeg Fixed) is running! 🎬');
});

app.post('/process', upload.single('video'), (req, res) => {
  try {
    const videoFile = req.file;
    const mode = req.body.mode || 'vhs';

    if (!videoFile) {
      return res.status(400).json({ error: '動画ファイルがありません' });
    }

    const inputPath = videoFile.path;
    const outputPath = path.join('/tmp', `processed_${Date.now()}.mp4`);

    console.log(`動画処理開始: ${videoFile.originalname} - モード: ${mode}`);

    // 音声があってもなくても、エラーで強制終了させずに「あれば圧縮、なければ無視」にする最強のオプション
    let ffmpegCommand = '';
    // 🟩 安定版コマンド（元通りの構成）
    if (mode === 'vhs') {
      ffmpegCommand = `"${ffmpegPath}" -y -i "${inputPath}" -map 0:v:0 -map 0:a:0 -vf "scale=iw/2:ih/2,noise=alls=15:allf=t" -b:v 400k -c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 64k "${outputPath}"`;
    } else if (mode === 'pixel') {
      ffmpegCommand = `"${ffmpegPath}" -y -i "${inputPath}" -map 0:v:0 -map 0:a:0 -vf "scale=160:-1:flags=neighbor,scale=iw*2:ih*2:flags=neighbor,format=pal8" -b:v 200k -c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 64k "${outputPath}"`;
    } else if (mode === 'matrix') {
      ffmpegCommand = `"${ffmpegPath}" -y -i "${inputPath}" -map 0:v:0 -map 0:a:0 -vf "scale=iw/2:ih/2,tblend=all_mode=average" -b:v 400k -c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 64k "${outputPath}"`;
    } else if (mode === 'monochrome') {
      ffmpegCommand = `"${ffmpegPath}" -y -i "${inputPath}" -map 0:v:0 -map 0:a:0 -vf "scale=iw/2:ih/2,hue=s=0,eq=contrast=1.3:brightness=0.05,noise=alls=25:allf=t" -b:v 400k -c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 64k "${outputPath}"`;
    } else {
      ffmpegCommand = `"${ffmpegPath}" -y -i "${inputPath}" -map 0:v:0 -map 0:a:0 -b:v 400k -c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 64k "${outputPath}"`;
    }

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

      if (error) {
        console.error(`FFmpegエラー: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        // エラーが起きてもサーバーを落とさず、フロントにエラーを返す
        return res.status(500).json({ error: 'FFmpegの実行に失敗しました' });
      }

      console.log('FFmpeg加工完了！送信します。');

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="ojapp_nostalgic_${Date.now()}.mp4"`);

      res.sendFile(outputPath, (err) => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
