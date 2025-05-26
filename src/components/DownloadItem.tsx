import { useState, useEffect } from "react";
import { DownloadStatus, getDownloadProgress } from "../lib/api";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Download, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface DownloadItemProps {
  download: DownloadStatus;
  onUpdate: (download: DownloadStatus) => void;
  onRemove: (id: string) => void;
}

export default function DownloadItem({
  download,
  onUpdate,
  onRemove,
}: DownloadItemProps) {
  const [isPolling, setIsPolling] = useState(
    download.status === "downloading" || download.status === "pending",
  );

  useEffect(() => {
    let interval: number | undefined;

    if (isPolling) {
      interval = window.setInterval(async () => {
        try {
          const updatedDownload = await getDownloadProgress(download.id);
          onUpdate(updatedDownload);

          if (
            updatedDownload.status === "completed" ||
            updatedDownload.status === "failed"
          ) {
            setIsPolling(false);
          }
        } catch (error) {
          console.error("Error updating download status:", error);
          setIsPolling(false);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [download.id, isPolling, onUpdate]);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    downloading: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3
            className="font-medium truncate max-w-[250px]"
            title={download.url}
          >
            {download.url}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {download.platform && (
              <span className="text-xs text-gray-500">{download.platform}</span>
            )}
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                statusColors[download.status],
              )}
            >
              {download.status.charAt(0).toUpperCase() +
                download.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {download.status === "completed" && download.downloadUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={download.downloadUrl} download>
                <Download className="h-4 w-4 mr-1" />
                Save
              </a>
            </Button>
          )}
          {download.status === "failed" && (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {download.error || "Download failed"}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(download.id)}
          >
            Remove
          </Button>
        </div>
      </div>

      {(download.status === "downloading" || download.status === "pending") && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Downloading...</span>
            <span>{Math.round(download.progress)}%</span>
          </div>
          <Progress value={download.progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
