const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const tesseract = require("node-tesseract-ocr");
const { file } = require("tmp-promise");

const app = express();
app.use(express.json({ limit: "5mb" }));

// Health
app.get("/", (req, res) => res.send({ ok: true }));

/**
 * POST /ocr
 * Body: { "imageUrl": "https://..." }
 * Response: { text: "..." }
 */
app.post("/ocr", async (req, res) => {
  try {
    const imageUrl = req.body.imageUrl;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

    // Download image to a temp file
    const tmp = await file({ postfix: path.extname(imageUrl) || ".jpg" });
    const tmpPath = tmp.path;

    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
      timeout: 20000
    });

    // Pipe response stream to temp file
    const writer = fs.createWriteStream(tmpPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on("error", err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) resolve();
      });
    });

    // Tesseract options - specify hindi language
    const config = {
      lang: "hin",
      oem: 1,
      psm: 3
    };

    const text = await tesseract.recognize(tmpPath, config);

    // Clean up temp file
    try { tmp.cleanup(); } catch (e) { /* ignore */ }

    return res.json({ text: (text || "").trim() });
  } catch (err) {
    console.error("OCR error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "OCR failed", details: String(err && err.message ? err.message : err) });
  }
});

// Use the port Render gives
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`OCR service running on port ${PORT}`);
});
