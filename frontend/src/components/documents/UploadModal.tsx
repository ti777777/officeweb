import { useState, useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'
import type { Document } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  onClose: () => void
  onUploaded: (doc: Document) => void
  uploadFn: (file: File, onProgress: (pct: number) => void) => Promise<Document>
}

const ACCEPTED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
].join(',')

export default function UploadModal({ onClose, onUploaded, uploadFn }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File) => setFile(f)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    try {
      const doc = await uploadFn(file, pct => setProgress(pct))
      onUploaded(doc)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !uploading) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('upload-file-input')?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors',
              dragOver
                ? 'border-primary bg-accent'
                : 'border-border hover:border-primary/50 hover:bg-accent/50',
            )}
          >
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', dragOver ? 'bg-primary/20' : 'bg-muted')}>
              <Upload className={cn('w-5 h-5', dragOver ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop a file or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, PowerPoint, ODF, TXT — max 100 MB</p>
            </div>
            <input
              id="upload-file-input"
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-accent rounded-lg px-4 py-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <File className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {!uploading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
