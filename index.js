const express = require('express');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

// メモリ上に動画ファイルを一時保存する設定
const upload = multer({ storage: multer.memoryStorage() });

// サーバー起動確認用のルート
app.get('/', (req, res) => {
  res.send('OJapp Video Backend is running! 🚀');
});

// スマホ（Worker）から動画を受け取る窓口
app.post('/process', upload.single('video'), (req, res) => {
  try {
    const videoFile = req.file;
    const mode = req.body.mode; // 'vhs' または 'minimal'

    if (!videoFile) {
      return res.status(400).json({ error: '動画ファイルがありません' });
    }

    console.log(`動画を受信しました: ${videoFile.originalname} (${videoFile.size} bytes) - モード: ${mode}`);

    // 【実験用】受け取った動画データをそのままオウム返しで送り返す
    // ※CORSヘッダーやファイル設定をして送る
    res.setHeader('Content-Type', videoFile.mimetype || 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="railway_test_${Date.now()}.mp4"`);
    
    return res.send(videoFile.buffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// サーバーを起動
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});