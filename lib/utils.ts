import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Download data as a CSV file
 * @param data CSV string data
 * @param filename Name of the file to download
 */
export function downloadCSV(data: string, filename: string): void {
  // Create a Blob object containing the CSV data
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Append to the document, click it to trigger download, then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up by revoking the URL object to free memory
  URL.revokeObjectURL(url);
}
