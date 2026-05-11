import { FileText, FileSpreadsheet, Presentation, Download, Trash2, Edit2, Eye, FolderInput } from 'lucide-react'
import type { Document } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  doc: Document
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onPreview?: (id: string) => void
  onMove?: (doc: Document) => void
  downloadUrl: string
}

type FileKind = 'pdf' | 'sheet' | 'slide' | 'doc'

function getKind(contentType: string): FileKind {
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'sheet'
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'slide'
  return 'doc'
}

const kindMeta: Record<FileKind, { icon: React.ReactNode; accent: string; label: string }> = {
  pdf:   { icon: <FileText className="w-5 h-5" />,         accent: 'text-red-500 bg-red-50',     label: 'PDF' },
  sheet: { icon: <FileSpreadsheet className="w-5 h-5" />,  accent: 'text-emerald-600 bg-emerald-50', label: 'Spreadsheet' },
  slide: { icon: <Presentation className="w-5 h-5" />,     accent: 'text-amber-600 bg-amber-50', label: 'Presentation' },
  doc:   { icon: <FileText className="w-5 h-5" />,         accent: 'text-primary bg-accent',     label: 'Document' },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocumentCard({ doc, onDelete, onEdit, onPreview, onMove, downloadUrl }: Props) {
  const kind = getKind(doc.contentType)
  const { icon, accent } = kindMeta[kind]
  const isPdf = kind === 'pdf'

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
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t">
        {isPdf ? (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 h-7 text-xs"
            onClick={() => onPreview?.(doc.id)}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => onEdit(doc.id)}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={downloadUrl}
              download={doc.fileName}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>

        {onMove && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onMove(doc)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FolderInput className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Move to folder</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onDelete(doc.id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
