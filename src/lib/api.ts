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
): Promise<{ valid: boolean; platform?: string }> {
  try {
    const response = await fetch("/api/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { valid: false, error: errorData.error };
    }

    return await response.json();
  } catch (error) {
    console.error("Error validating URL:", error);
    return { valid: false, error: "Network error" };
  }
}

// Real function to start a download
export async function startDownload(
  options: DownloadOptions,
): Promise<DownloadStatus> {
  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to start download");
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting download:", error);
    return {
      id: crypto.randomUUID(),
      url: options.url,
      status: "failed",
      progress: 0,
      error: error instanceof Error ? error.message : "Network error",
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
