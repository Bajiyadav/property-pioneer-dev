/**
 * Lightweight, zero-dependency browser ZIP generator (Store mode PKZip)
 * Converts multiple image/video URLs into a single .zip download package.
 */

interface ZipItem {
  name: string;
  url: string;
}

export async function downloadFilesAsZip(
  items: ZipItem[],
  zipFilename: string = "Property_Media.zip",
  onProgress?: (percent: number) => void,
): Promise<void> {
  try {
    const fileEntries: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = [];
    let currentOffset = 0;
    const parts: Uint8Array[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (onProgress) {
        onProgress(Math.round(((i + 0.2) / items.length) * 100));
      }

      let fileData: Uint8Array;
      try {
        const response = await fetch(item.url);
        const arrayBuf = await response.arrayBuffer();
        fileData = new Uint8Array(arrayBuf);
      } catch (e) {
        console.warn(`Failed to fetch media URL for zip: ${item.url}`, e);
        continue;
      }

      const nameBytes = new TextEncoder().encode(item.name);
      const crc = crc32(fileData);
      const offset = currentOffset;

      // Local Header (30 bytes + filename)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(localHeader.buffer);

      dv.setUint32(0, 0x04034b50, true); // Local file header signature
      dv.setUint16(4, 20, true); // Version needed to extract
      dv.setUint16(6, 0, true); // General purpose bit flag
      dv.setUint16(8, 0, true); // Compression method (0 = store)
      dv.setUint16(10, 0, true); // Last mod file time
      dv.setUint16(12, 0, true); // Last mod file date
      dv.setUint32(14, crc, true); // CRC-32
      dv.setUint32(18, fileData.length, true); // Compressed size
      dv.setUint32(22, fileData.length, true); // Uncompressed size
      dv.setUint16(26, nameBytes.length, true); // Filename length
      dv.setUint16(28, 0, true); // Extra field length
      localHeader.set(nameBytes, 30);

      parts.push(localHeader);
      parts.push(fileData);

      fileEntries.push({ name: nameBytes, data: fileData, crc, offset });
      currentOffset += localHeader.length + fileData.length;

      if (onProgress) {
        onProgress(Math.round(((i + 0.9) / items.length) * 100));
      }
    }

    if (fileEntries.length === 0) {
      throw new Error("No media items could be fetched for zip creation.");
    }

    // Central Directory Records
    const centralDirectoryStart = currentOffset;
    let centralDirectorySize = 0;

    for (const entry of fileEntries) {
      const cdHeader = new Uint8Array(46 + entry.name.length);
      const dv = new DataView(cdHeader.buffer);

      dv.setUint32(0, 0x02014b50, true); // Central directory header signature
      dv.setUint16(4, 20, true); // Version made by
      dv.setUint16(6, 20, true); // Version needed to extract
      dv.setUint16(8, 0, true); // General purpose bit flag
      dv.setUint16(10, 0, true); // Compression method (0 = store)
      dv.setUint16(12, 0, true); // Last mod time
      dv.setUint16(14, 0, true); // Last mod date
      dv.setUint32(16, entry.crc, true); // CRC-32
      dv.setUint32(20, entry.data.length, true); // Compressed size
      dv.setUint32(24, entry.data.length, true); // Uncompressed size
      dv.setUint16(28, entry.name.length, true); // Filename length
      dv.setUint16(30, 0, true); // Extra field length
      dv.setUint16(32, 0, true); // File comment length
      dv.setUint16(34, 0, true); // Disk number start
      dv.setUint16(36, 0, true); // Internal file attributes
      dv.setUint32(38, 0, true); // External file attributes
      dv.setUint32(42, entry.offset, true); // Relative offset of local header
      cdHeader.set(entry.name, 46);

      parts.push(cdHeader);
      currentOffset += cdHeader.length;
      centralDirectorySize += cdHeader.length;
    }

    // End of Central Directory Record (EOCD)
    const eocd = new Uint8Array(22);
    const dvEocd = new DataView(eocd.buffer);
    dvEocd.setUint32(0, 0x06054b50, true); // EOCD signature
    dvEocd.setUint16(4, 0, true); // Disk number
    dvEocd.setUint16(6, 0, true); // Disk with central directory
    dvEocd.setUint16(8, fileEntries.length, true); // Number of entries on disk
    dvEocd.setUint16(10, fileEntries.length, true); // Total number of entries
    dvEocd.setUint32(12, centralDirectorySize, true); // Central directory size
    dvEocd.setUint32(16, centralDirectoryStart, true); // Offset of central directory
    dvEocd.setUint16(20, 0, true); // Zip comment length

    parts.push(eocd);

    const blob = new Blob(parts as BlobPart[], { type: "application/zip" });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    if (onProgress) onProgress(100);
  } catch (err) {
    console.error("ZIP Generation error, falling back to individual downloads", err);
    // Fallback: Trigger single file downloads
    for (const item of items) {
      triggerSingleDownload(item.url, item.name);
    }
  }
}

export function triggerSingleDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// CRC32 table calculation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}
