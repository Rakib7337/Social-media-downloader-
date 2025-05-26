import { useState } from "react";
import UrlForm from "./UrlForm";
import DownloadItem from "./DownloadItem";
import { DownloadOptions, DownloadStatus, startDownload } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Download, History } from "lucide-react";

function Home() {
  const [downloads, setDownloads] = useState<DownloadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (options: DownloadOptions) => {
    setIsProcessing(true);
    try {
      const download = await startDownload(options);
      setDownloads((prev) => [download, ...prev]);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Media Downloader</h1>
          <p className="text-gray-600">
            Download videos and images from Instagram, TikTok, Twitter, and
            YouTube
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <UrlForm onSubmit={handleDownload} isProcessing={isProcessing} />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Active Downloads
              {activeDownloads.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {activeDownloads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Download History
              {completedDownloads.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                  {completedDownloads.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {activeDownloads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active downloads. Paste a URL to start downloading.
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

          <TabsContent value="history">
            <div className="space-y-4">
              {completedDownloads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No download history yet.
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

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Note: This is a frontend demo. In a production environment, yt-dlp
            would run on a server.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
