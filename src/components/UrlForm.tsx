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
import { AlertCircle } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Paste social media URL here..."
            value={url}
            onChange={handleUrlChange}
            className="pr-12"
            disabled={isProcessing}
          />
          {platform && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {platform}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center text-red-500 text-sm mt-1">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto sm:flex-1">
          <Select
            value={quality}
            onValueChange={setQuality}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best Quality</SelectItem>
              <SelectItem value="medium">Medium Quality</SelectItem>
              <SelectItem value="low">Low Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:flex-1">
          <Select
            value={format}
            onValueChange={setFormat}
            disabled={isProcessing}
          >
            <SelectTrigger>
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

        <Button type="submit" disabled={isProcessing || !url.trim()}>
          {isProcessing ? "Processing..." : "Download"}
        </Button>
      </div>
    </form>
  );
}
