import { FileText, FileSpreadsheet, Presentation, Download, Trash2, Edit2, Eye, FolderInput, MoreHorizontal, Copy } from 'lucide-react'
import { useState } from 'react'
import type { Document } from '@/types'
import { cn } from '@/lib/utils'
import { documentsApi } from '@/api/documents'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Props {
  doc: Document
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onPreview?: (id: string) => void
  onMove?: (doc: Document) => void
  onClone?: (cloned: Document) => void
}

type FileKind = 'pdf' | 'sheet' | 'slide' | 'doc'

function getKind(contentType: string): FileKind {
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'sheet'
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'slide'
  return 'doc'
}

const kindMeta: Record<FileKind, { icon: React.ReactNode; accent: string; label: string }> = {
  pdf:   { icon: <FileText className="w-5 h-5" />,         accent: 'text-red-500 bg-red-50',         label: 'PDF' },
  sheet: { icon: <FileSpreadsheet className="w-5 h-5" />,  accent: 'text-emerald-600 bg-emerald-50', label: 'Spreadsheet' },
  slide: { icon: <Presentation className="w-5 h-5" />,     accent: 'text-amber-600 bg-amber-50',     label: 'Presentation' },
  doc:   { icon: <FileText className="w-5 h-5" />,         accent: 'text-primary bg-accent',         label: 'Document' },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocumentCard({ doc, onDelete, onEdit, onPreview, onMove, onClone }: Props) {
  const kind = getKind(doc.contentType)
  const { icon, accent } = kindMeta[kind]
  const isPdf = kind === 'pdf'
  const [downloading, setDownloading] = useState(false)
  const [cloning, setCloning] = useState(false)

  const handleClone = async () => {
    if (cloning) return
    setCloning(true)
    try {
      const cloned = await documentsApi.clone(doc.id)
      onClone?.(cloned)
    } finally {
      setCloning(false)
    }
  }

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await documentsApi.getBlob(doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="group bg-card border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/40 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', accent)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-medium truncate leading-snug" title={doc.fileName}>
            {doc.fileName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatBytes(doc.size)} · {formatDate(doc.updatedAt)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {isPdf ? (
              <DropdownMenuItem onClick={() => onPreview?.(doc.id)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onEdit(doc.id)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => void handleDownload()} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Downloading…' : 'Download'}
            </DropdownMenuItem>
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(doc)}>
                <FolderInput className="w-4 h-4 mr-2" />
                Move to folder
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => void handleClone()} disabled={cloning}>
              <Copy className="w-4 h-4 mr-2" />
              {cloning ? 'Cloning…' : 'Clone'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(doc.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
