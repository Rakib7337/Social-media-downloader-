import { useState } from "react";
import UrlForm from "./UrlForm";
import DownloadItem from "./DownloadItem";
import { DownloadOptions, DownloadStatus, startDownload } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Download, History, Instagram, Twitter, Youtube } from "lucide-react";
import { BrandTiktok as TikTok } from "./ui/custom-icons";

function Home() {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (options: DownloadOptions) => {
    setIsProcessing(true);
    try {
      const download = await startDownload(options);
      setDownloads((prev) => [download, ...prev]);

      // If we're in offline mode (server not running), show a message
      if (
        download.status === "failed" &&
        download.error?.includes("Network error")
      ) {
        // Create a mock successful download for demo purposes
        const mockDownload: DownloadStatus = {
          id: crypto.randomUUID(),
          url: options.url,
          status: "completed",
          progress: 100,
          platform: options.url.includes("youtube")
            ? "YouTube (Demo Mode)"
            : "Unknown Platform",
          filename: "demo-file.mp4",
          downloadUrl: "#",
        };
        setDownloads((prev) => [mockDownload, ...prev]);
      }
    } catch (error) {
      console.error("Error starting download:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateDownload = (updatedDownload: DownloadStatus) => {
    setDownloads((prev) =>
      prev.map((download) =>
        download.id === updatedDownload.id ? updatedDownload : download,
      ),
    );
  };

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((download) => download.id !== id));
  };

  const activeDownloads = downloads.filter(
    (d) => d.status === "downloading" || d.status === "pending",
  );

  const completedDownloads = downloads.filter(
    (d) => d.status === "completed" || d.status === "failed",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full">
              <Download className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Social Media Downloader
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            Download videos and images from your favorite social platforms with
            just one click
          </p>

          <div className="flex justify-center gap-8 mt-6">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-pink-100 rounded-full dark:bg-pink-900/30">
                <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                Instagram
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/30">
                <Twitter className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                Twitter
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-red-100 rounded-full dark:bg-red-900/30">
                <Youtube className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                YouTube
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-black/10 rounded-full dark:bg-white/10">
                <TikTok className="h-6 w-6 text-black dark:text-white" />
              </div>
              <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                TikTok
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
          <UrlForm onSubmit={handleDownload} isProcessing={isProcessing} />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="active"
              className="flex items-center rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Active Downloads
              {activeDownloads.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                  {activeDownloads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              <History className="h-4 w-4 mr-2" />
              Download History
              {completedDownloads.length > 0 && (
                <span className="ml-2 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                  {completedDownloads.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="active"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
          >
            <div className="space-y-4">
              {activeDownloads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Download className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No active downloads. Paste a URL to start downloading.</p>
                </div>
              ) : (
                activeDownloads.map((download) => (
                  <DownloadItem
                    key={download.id}
                    download={download}
                    onUpdate={updateDownload}
                    onRemove={removeDownload}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
          >
            <div className="space-y-4">
              {completedDownloads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No download history yet.</p>
                </div>
              ) : (
                completedDownloads.map((download) => (
                  <DownloadItem
                    key={download.id}
                    download={download}
                    onUpdate={updateDownload}
                    onRemove={removeDownload}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm">
          <p>
            Note: This is a frontend demo. In a production environment, yt-dlp
            would run on a server.
          </p>
          <p className="mt-2">
            To use the full functionality, make sure to run{" "}
            <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-sm">
              npm run dev:full
            </code>{" "}
            to start both frontend and backend servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
