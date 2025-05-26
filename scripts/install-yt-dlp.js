import ytDlpWrap from "yt-dlp-wrap";
import fs from "fs-extra";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const YTDlpWrap = ytDlpWrap.default || ytDlpWrap;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the bin directory exists
const binDir = join(__dirname, "..", "bin");
fs.ensureDirSync(binDir);

console.log("Installing yt-dlp binary...");

// Download the yt-dlp binary
YTDlpWrap.downloadFromGithub(binDir)
  .then(() => {
    console.log("yt-dlp binary installed successfully!");
  })
  .catch((error) => {
    console.error("Error installing yt-dlp binary:", error);
    process.exit(1);
  });
