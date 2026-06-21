const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 今回は動画を一度ファイルとして保存するため、ディスク（/tmp）を使う設定
const upload = multer({ dest: '/tmp/' });

app.get('/', (req, res) => {
  res.send('OJapp Video Backend (FFmpeg Mode) is running! 🎬');
});

// 🎬 ここが本丸：FFmpegで動画をゴリゴリに削る処理
app.post('/process', upload.single('video'), (req, res) => {
  try {
    const videoFile = req.file;
    const mode = req.body.mode || 'vhs'; // 'vhs' または 'minimal'

    if (!videoFile) {
      return res.status(400).json({ error: '動画ファイルがありません' });
    }

    // 一時保存された入力ファイルのパス
    const inputPath = videoFile.path;
    // 出力ファイルのパス（適当な名前で/tmp内に作る）
    const outputPath = path.join('/tmp', `processed_${Date.now()}.mp4`);

    console.log(`動画処理を開始します: ${videoFile.originalname} (${videoFile.size} bytes) - モード: ${mode}`);

    // 🚀 モードに応じてFFmpegのコマンド（呪文）を切り替える
    let ffmpegCommand = '';

    if (mode === 'vhs') {
      // 【VHSモード】
      // 1. 解像度を縦横半分に縮小（scale）してガラケー画質にする
      // 2. ビットレートを400kに極限まで落として圧縮ノイズを出す（b:v 400k）
      // 3. 音声も少しカサカサにする（b:a 64k）
      ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "scale=iw/2:ih/2" -b:v 400k -c:v libx264 -preset fast -b:a 64k "${outputPath}"`;
    } else {
      // 【Minimalモード（ただの超軽量化）】
      // 解像度はそのまま、ビットレートだけ400kに落として容量を極小にする
      ffmpegCommand = `ffmpeg -y -i "${inputPath}" -b:v 400k -c:v libx264 -preset fast "${outputPath}"`;
    }

    // 🛠️ コマンドライン（重機）を実行！
    exec(ffmpegCommand, (error, stdout, stderr) => {
      // 処理が終わったら、元動画（入力ファイル）は用済みなので即削除
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

      if (error) {
        console.error(`FFmpegエラー: ${error.message}`);
        return res.status(500).json({ error: '動画の圧縮・加工に失敗しました' });
      }

      console.log('FFmpegの加工が完了しました！スマホへ送信します。');

      // 4. 完成した動画ファイルをスマホに送り返す
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="ojapp_nostalgic_${Date.now()}.mp4"`);

      // ファイルをスマホに送り届けて、送り終わったらその完成品ファイルもサーバーから削除する（メモリ節約）
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