// API functions for the social media downloader

export interface DownloadOptions {
  url: string;
  format?: string;
  quality?: string;
}

export interface DownloadStatus {
  id: string;
  url: string;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
  platform?: string;
  error?: string;
  filename?: string;
  downloadUrl?: string;
}

// Real implementation that calls the backend API
export async function validateUrl(
  url: string,
): Promise<{ valid: boolean; platform?: string; error?: string }> {
  try {
    // Basic URL validation before sending to server
    try {
      new URL(url);
    } catch (e) {
      return { valid: false, error: "Invalid URL format" };
    }

    // Check if URL is from YouTube
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

    // Check if server is available by making a simple request
    try {
      const serverCheckResponse = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        // Set a timeout to avoid long waits if server is down
        signal: AbortSignal.timeout(3000),
      });

      if (!serverCheckResponse.ok) {
        const errorData = await serverCheckResponse.json();
        return { valid: false, error: errorData.error };
      }

      return await serverCheckResponse.json();
    } catch (fetchError) {
      console.error("Error connecting to server:", fetchError);
      // If server is not running but URL is valid, provide a fallback for YouTube
      if (isYouTube) {
        return { valid: true, platform: "YouTube (Offline Mode)" };
      }
      return {
        valid: false,
        error: "Network error - Please make sure the server is running",
      };
    }
  } catch (error) {
    console.error("Error validating URL:", error);
    return {
      valid: false,
      error: "Unexpected error occurred during validation",
    };
  }
}

// Real function to start a download
export async function startDownload(
  options: DownloadOptions,
): Promise<DownloadStatus> {
  try {
    // First check if server is available
    let serverAvailable = false;
    try {
      const serverCheckResponse = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: options.url }),
        signal: AbortSignal.timeout(2000), // Short timeout to check server availability
      });
      serverAvailable = serverCheckResponse.ok;
    } catch (e) {
      console.log(
        "Server check failed, proceeding with download attempt anyway",
      );
    }

    // Proceed with download request
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
      // Set a reasonable timeout for the download request
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to start download");
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting download:", error);

    // Check if the error is due to server not running
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network error") ||
        error.message.includes("timeout"));

    return {
      id: crypto.randomUUID(),
      url: options.url,
      status: "failed",
      progress: 0,
      error: isNetworkError
        ? "Network error - Please make sure the server is running"
        : error instanceof Error
          ? error.message
          : "Unknown error",
    };
  }
}

// Real function to get download progress
export async function getDownloadProgress(id: string): Promise<DownloadStatus> {
  try {
    const response = await fetch(`/api/download/${id}`);

    if (!response.ok) {
      throw new Error("Failed to get download progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting download progress:", error);
    throw error;
  }
}
