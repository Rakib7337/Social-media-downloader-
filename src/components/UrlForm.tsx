import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { validateUrl, DownloadOptions } from "../lib/api";
import {
  AlertCircle,
  Link,
  FileType,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface UrlFormProps {
  onSubmit: (options: DownloadOptions) => void;
  isProcessing: boolean;
}

export default function UrlForm({ onSubmit, isProcessing }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("best");
  const [format, setFormat] = useState("mp4");
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const validation = await validateUrl(url);

      if (!validation.valid) {
        setError(validation.error || "Please enter a valid URL");
        return;
      }

      if (validation.platform === "Unknown") {
        setError("Unsupported platform");
        return;
      }

      setPlatform(validation.platform || null);
      onSubmit({ url, quality, format });
      setUrl("");
    } catch (error) {
      console.error("Error in form submission:", error);
      setError("Network error - Please make sure the server is running");
    }
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);
    setPlatform(null);

    // Only validate when URL looks complete enough
    if (newUrl.trim() !== "" && newUrl.includes(".")) {
      try {
        const validation = await validateUrl(newUrl);
        if (validation.valid && validation.platform) {
          setPlatform(validation.platform);
        }
      } catch (err) {
        // Silently fail on URL change validation
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
          <Link className="h-5 w-5 mr-2 text-blue-600" /> Paste URL
        </h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Paste social media URL here..."
            value={url}
            onChange={handleUrlChange}
            className="pr-12 h-12 text-base border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            disabled={isProcessing}
          />
          {platform && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {platform}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center text-red-500 dark:text-red-400 text-sm mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center">
          <FileType className="h-5 w-5 mr-2 text-blue-600" /> Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Quality
            </label>
            <Select
              value={quality}
              onValueChange={setQuality}
              disabled={isProcessing}
            >
              <SelectTrigger className="h-11 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="low">Low Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Format
            </label>
            <Select
              value={format}
              onValueChange={setFormat}
              disabled={isProcessing}
            >
              <SelectTrigger className="h-11 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4 Video</SelectItem>
                <SelectItem value="mp3">MP3 Audio</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="jpg">JPG Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isProcessing || !url.trim()}
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          {isProcessing ? (
            <span className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center">
              Download Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
