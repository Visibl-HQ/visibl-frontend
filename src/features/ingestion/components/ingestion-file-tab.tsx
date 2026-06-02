"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, FileUp, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatFileSize,
  validateIngestionFile,
} from "@/features/ingestion/lib/file-validation"

type IngestionFileTabProps = {
  disabled?: boolean
  onSelectFiles: (files: File[]) => void | Promise<void>
}

export function IngestionFileTab({
  disabled = false,
  onSelectFiles,
}: IngestionFileTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return
      }

      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of files) {
        const validation = validateIngestionFile(file)

        if (validation.valid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      }

      if (validFiles.length === 0) {
        setLocalError(errors.join(" "))
        return
      }

      setLocalError(errors.length > 0 ? errors.join(" ") : null)
      setSelectedFiles(validFiles)
      setIsSubmitting(true)

      try {
        await onSelectFiles(validFiles)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSelectFiles]
  )

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""

    if (files.length > 0) {
      void handleFiles(files)
    }
  }

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          "border-border/70 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          dragActive && "border-brand/50 bg-brand/5",
          disabled && "pointer-events-none opacity-60"
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          void handleFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <div className="bg-background flex size-10 items-center justify-center rounded-full border shadow-sm">
          <Upload className="text-muted-foreground size-4" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-medium">Drop files here</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-5">
          PDF, Office docs, text, JSON, CSV, ZIP, or images up to 25 MB each.
          Add as many files as you need.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={disabled || isSubmitting}
          onClick={() => inputRef.current?.click()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <FileUp className="size-3.5" aria-hidden="true" />
              Choose files
            </>
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.doc,.docx,.pptx,.xlsx,.txt,.md,.json,.csv,.zip,.jpg,.jpeg,.png,.webp"
          disabled={disabled || isSubmitting}
          onChange={handleInputChange}
        />
      </div>

      {selectedFiles.length > 0 ? (
        <ul className="grid gap-1.5">
          {selectedFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="bg-muted/30 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
            >
              <span className="truncate font-medium">{file.name}</span>
              <span className="text-muted-foreground shrink-0">
                {formatFileSize(file.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {localError ? (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <p>{localError}</p>
        </div>
      ) : null}
    </div>
  )
}
