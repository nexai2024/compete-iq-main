/**
 * Validates that the provided URL is a valid github.com URL.
 * @param url The URL to validate.
 * @returns True if the URL is a valid github.com URL, false otherwise.
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'github.com';
  } catch {
    return false;
  }
}
