export function getFilesFromClipboard(
  clipboardData: DataTransfer | null
): File[] {
  if (!clipboardData) {
    return []
  }

  return Array.from(clipboardData.files)
}

export function getFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files)
}
