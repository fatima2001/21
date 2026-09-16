/** حفظ الملفات على جهاز المستخدم — بدون أي خادم */

type DirHandle = {
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
};

export function supportsDirectoryPicker() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function pickDirectory(): Promise<DirHandle | null> {
  if (!supportsDirectoryPicker()) return null;
  try {
    const picker = (
      window as unknown as { showDirectoryPicker: (o?: unknown) => Promise<DirHandle> }
    ).showDirectoryPicker;
    return await picker({ mode: "readwrite" });
  } catch {
    return null;
  }
}

export async function writeToDirectory(dir: DirHandle, name: string, blob: Blob) {
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
