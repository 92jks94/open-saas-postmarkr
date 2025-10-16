/**
 * Calculate estimated reading time for a given text content
 * @param content The text content to analyze
 * @param wordsPerMinute Average reading speed (default: 200 words per minute)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content || typeof content !== 'string') {
    return 0;
  }
  
  // Remove markdown syntax and HTML tags for more accurate word count
  const cleanedContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[#*_~\[\]()]/g, '') // Remove markdown formatting
    .trim();
  
  // Count words
  const wordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;
  
  // Calculate reading time and round up to nearest minute
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  // Return at least 1 minute
  return Math.max(1, minutes);
}

/**
 * Format reading time into a human-readable string
 * @param minutes Number of minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 min read';
  }
  return `${minutes} min read`;
}

/**
 * Get reading time from content and return formatted string
 * @param content The text content to analyze
 * @returns Formatted reading time string
 */
export function getReadingTime(content: string): string {
  const minutes = calculateReadingTime(content);
  return formatReadingTime(minutes);
}

