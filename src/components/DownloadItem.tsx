import { useState, useEffect } from "react";
import { DownloadStatus, getDownloadProgress } from "../lib/api";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import {
  Download,
  ExternalLink,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
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
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    downloading:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    completed:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    failed:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4 mr-1.5" />,
    downloading: <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 mr-1.5" />,
    failed: <AlertCircle className="h-4 w-4 mr-1.5" />,
  };

  // Format URL for display
  const displayUrl = () => {
    try {
      const url = new URL(download.url);
      return `${url.hostname}${url.pathname.substring(0, 15)}${url.pathname.length > 15 ? "..." : ""}`;
    } catch (e) {
      return (
        download.url.substring(0, 30) + (download.url.length > 30 ? "..." : "")
      );
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-4 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3
            className="font-medium truncate max-w-[250px] text-slate-800 dark:text-slate-200"
            title={download.url}
          >
            {displayUrl()}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            {download.platform && (
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                {download.platform}
              </span>
            )}
            <span
              className={cn(
                "text-xs px-2.5 py-0.5 rounded-full flex items-center",
                statusColors[download.status],
              )}
            >
              {statusIcons[download.status]}
              {download.status.charAt(0).toUpperCase() +
                download.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {download.status === "completed" && download.downloadUrl && (
            <Button
              size="sm"
              variant="outline"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              asChild
            >
              <a href={download.downloadUrl} download>
                <Download className="h-4 w-4 mr-1.5" />
                Save File
              </a>
            </Button>
          )}
          {download.status === "failed" && (
            <div className="flex items-center text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              {download.error || "Download failed"}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            onClick={() => onRemove(download.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(download.status === "downloading" || download.status === "pending") && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Downloading...
            </span>
            <span className="font-medium">
              {Math.round(download.progress)}%
            </span>
          </div>
          <Progress
            value={download.progress}
            className="h-2.5 bg-slate-100 dark:bg-slate-700"
            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
          />
        </div>
      )}
    </div>
  );
}
