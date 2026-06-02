"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportImportWizard } from "@/features/ingestion/components/export-import-wizard"
import { IngestionFileTab } from "@/features/ingestion/components/ingestion-file-tab"
import { IngestionPasteTab } from "@/features/ingestion/components/ingestion-paste-tab"
import type { SourceType, ExportProvider } from "@/lib/api/types"

type IngestionDialogProps = {
  open: boolean
  projectId: string
  disabled?: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onUploadFiles: (files: File[]) => void | Promise<void>
  onSubmitPaste: (text: string, sourceType?: SourceType) => void | Promise<void>
  onSelectExportConversation: (
    transcript: string,
    provider: ExportProvider,
    conversationId: string
  ) => void | Promise<void>
  onSubmitMemoryPaste: (text: string) => void | Promise<void>
}

export function IngestionDialog({
  open,
  projectId,
  disabled = false,
  error,
  onOpenChange,
  onUploadFiles,
  onSubmitPaste,
  onSelectExportConversation,
  onSubmitMemoryPaste,
}: IngestionDialogProps) {
  const [activeTab, setActiveTab] = useState("upload")

  function handleOpenChange(nextOpen: boolean) {
    if (disabled && nextOpen) {
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import context</DialogTitle>
          <DialogDescription>
            Upload files, paste notes, or import a ChatGPT/Claude export. You
            can also paste files directly into the chat box. Visibl extracts a
            preview before updating pins or your problem doc.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>{error}</p>
          </div>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="upload"
          className="gap-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <IngestionFileTab
              disabled={disabled}
              onSelectFiles={onUploadFiles}
            />
          </TabsContent>

          <TabsContent value="paste">
            <IngestionPasteTab
              projectId={projectId}
              active={open && activeTab === "paste"}
              disabled={disabled}
              onSubmitPaste={onSubmitPaste}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportImportWizard
              projectId={projectId}
              active={activeTab === "export"}
              disabled={disabled}
              onSelectConversation={onSelectExportConversation}
              onSubmitMemoryPaste={onSubmitMemoryPaste}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
