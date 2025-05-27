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

// Define the specific output file path for the binary
const binaryPath = join(binDir, "yt-dlp");

console.log("Installing yt-dlp binary...");

// Download the yt-dlp binary to the specific file path
YTDlpWrap.downloadFromGithub(binaryPath)
  .then(() => {
    console.log("yt-dlp binary installed successfully!");
  })
  .catch((error) => {
    console.error("Error installing yt-dlp binary:", error);
    process.exit(1);
  });
