import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs-extra";
import multer from "multer";
import ytDlpWrap from "yt-dlp-wrap";

const { YTDlpWrap } = ytDlpWrap;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, "uploads");
fs.ensureDirSync(uploadsDir);

// Serve static files from the uploads directory
app.use("/downloads", express.static(uploadsDir));

// Initialize yt-dlp
const ytDlp = new YTDlpWrap();

// Store active downloads
const activeDownloads = new Map();

// Validate URL and identify platform
app.post("/api/validate", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ valid: false, error: "URL is required" });
    }

    try {
      new URL(url);
    } catch (e) {
      return res
        .status(400)
        .json({ valid: false, error: "Invalid URL format" });
    }

    // Get video info to validate URL and identify platform
    try {
      const info = await ytDlp.getVideoInfo(url);
      const platform = getPlatformFromExtractor(info.extractor);

      return res.json({
        valid: true,
        platform: platform || "Unknown",
        title: info.title,
      });
    } catch (error) {
      console.error("Error validating URL:", error);
      return res.status(400).json({
        valid: false,
        error: "URL not supported by yt-dlp",
      });
    }
  } catch (error) {
    console.error("Server error during validation:", error);
    res.status(500).json({ valid: false, error: "Server error" });
  }
});

// Start download
app.post("/api/download", async (req, res) => {
  try {
    const { url, format, quality } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Generate a unique ID for this download
    const downloadId = Date.now().toString();
    const outputFilename = `${downloadId}.%(ext)s`;
    const outputPath = join(uploadsDir, outputFilename);

    // Set download options based on format and quality
    const options = getDownloadOptions(format, quality);

    // Create download status object
    const downloadStatus = {
      id: downloadId,
      url,
      status: "pending",
      progress: 0,
      platform: "Unknown", // Will be updated during download
      filename: null,
      downloadUrl: null,
    };

    // Store in active downloads
    activeDownloads.set(downloadId, downloadStatus);

    // Send initial response
    res.json(downloadStatus);

    // Start download process asynchronously
    startDownload(downloadId, url, outputPath, options);
  } catch (error) {
    console.error("Error starting download:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get download status
app.get("/api/download/:id", (req, res) => {
  const { id } = req.params;

  if (!activeDownloads.has(id)) {
    return res.status(404).json({ error: "Download not found" });
  }

  res.json(activeDownloads.get(id));
});

// Helper function to start download
async function startDownload(downloadId, url, outputPath, options) {
  const downloadStatus = activeDownloads.get(downloadId);

  try {
    // Update status to downloading
    downloadStatus.status = "downloading";

    // Get video info to identify platform
    try {
      const info = await ytDlp.getVideoInfo(url);
      downloadStatus.platform = getPlatformFromExtractor(info.extractor);
    } catch (error) {
      console.error("Error getting video info:", error);
    }

    // Start download with progress tracking
    await new Promise((resolve, reject) => {
      const download = ytDlp.execPromise([
        url,
        "-o",
        outputPath,
        ...options,
        "--newline",
        "--progress-template",
        "%(progress.downloaded_bytes)s/%(progress.total_bytes)s",
      ]);

      let finalFilename = null;

      download.on("progress", (progress) => {
        if (progress && progress.percent) {
          downloadStatus.progress = progress.percent;
        }
      });

      download.on("ytDlpEvent", (eventType, eventData) => {
        if (eventType === "download" && eventData) {
          const match = eventData.match(/(\d+)\/(\d+)/);
          if (match && match[1] && match[2]) {
            const downloaded = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (total > 0) {
              downloadStatus.progress = Math.round((downloaded / total) * 100);
            }
          }
        } else if (eventType === "finished" && eventData) {
          finalFilename = eventData.trim();
        }
      });

      download
        .then(() => {
          // Find the actual file that was created
          if (!finalFilename) {
            const files = fs.readdirSync(uploadsDir);
            const downloadFile = files.find((file) =>
              file.startsWith(downloadId),
            );
            if (downloadFile) {
              finalFilename = downloadFile;
            }
          }

          if (finalFilename) {
            const fileExt = finalFilename.split(".").pop();
            const safeFilename = `${downloadId}.${fileExt}`;
            const filePath = join(uploadsDir, finalFilename);
            const newFilePath = join(uploadsDir, safeFilename);

            // Rename if needed
            if (filePath !== newFilePath) {
              fs.renameSync(filePath, newFilePath);
              finalFilename = safeFilename;
            }

            // Update download status
            downloadStatus.status = "completed";
            downloadStatus.progress = 100;
            downloadStatus.filename = finalFilename;
            downloadStatus.downloadUrl = `/downloads/${finalFilename}`;
          } else {
            throw new Error("Download completed but file not found");
          }

          resolve();
        })
        .catch((error) => {
          console.error("Download error:", error);
          downloadStatus.status = "failed";
          downloadStatus.error = error.message || "Download failed";
          reject(error);
        });
    });
  } catch (error) {
    console.error("Error during download:", error);
    downloadStatus.status = "failed";
    downloadStatus.error = error.message || "Download failed";
  }
}

// Helper function to get platform from extractor
function getPlatformFromExtractor(extractor) {
  if (!extractor) return "Unknown";

  const extractorLower = extractor.toLowerCase();

  if (extractorLower.includes("youtube")) return "YouTube";
  if (extractorLower.includes("instagram")) return "Instagram";
  if (extractorLower.includes("tiktok")) return "TikTok";
  if (extractorLower.includes("twitter") || extractorLower.includes("x"))
    return "Twitter";

  return extractor; // Return the extractor name if no match
}

// Helper function to get download options based on format and quality
function getDownloadOptions(format, quality) {
  const options = [];

  // Format options
  if (format === "mp3") {
    options.push("-x", "--audio-format", "mp3");
  } else if (format === "mp4") {
    options.push(
      "-f",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    );
  } else if (format === "webm") {
    options.push(
      "-f",
      "bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/best",
    );
  } else if (format === "jpg") {
    options.push(
      "--write-thumbnail",
      "--skip-download",
      "--convert-thumbnails",
      "jpg",
    );
  }

  // Quality options
  if (quality === "best" && format !== "mp3" && format !== "jpg") {
    // Already handled in format options
  } else if (quality === "medium" && format !== "mp3" && format !== "jpg") {
    options.push(
      "-f",
      "bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720]/best",
    );
  } else if (quality === "low" && format !== "mp3" && format !== "jpg") {
    options.push(
      "-f",
      "bestvideo[height<=480][ext=mp4]+bestaudio/best[height<=480]/best",
    );
  }

  return options;
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
