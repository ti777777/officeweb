import { FileText, FileSpreadsheet, Presentation, Download, Trash2, Edit2, Eye } from 'lucide-react'
import type { Document } from '../../types'

interface Props {
  doc: Document
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onPreview?: (id: string) => void
  downloadUrl: string
}

function fileIcon(contentType: string) {
  if (contentType === 'application/pdf')
    return <FileText className="w-8 h-8 text-red-500" />
  if (contentType.includes('spreadsheet') || contentType.includes('excel'))
    return <FileSpreadsheet className="w-8 h-8 text-green-500" />
  if (contentType.includes('presentation') || contentType.includes('powerpoint'))
    return <Presentation className="w-8 h-8 text-orange-500" />
  return <FileText className="w-8 h-8 text-blue-500" />
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
}

const isPdf = (contentType: string) => contentType === 'application/pdf'

export default function DocumentCard({ doc, onDelete, onEdit, onPreview, downloadUrl }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{fileIcon(doc.contentType)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate" title={doc.fileName}>
            {doc.fileName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatBytes(doc.size)} · {formatDate(doc.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        {isPdf(doc.contentType) ? (
          <button
            onClick={() => onPreview?.(doc.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        ) : (
          <button
            onClick={() => onEdit(doc.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}

        <a
          href={downloadUrl}
          download={doc.fileName}
          className="flex items-center justify-center p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>

        <button
          onClick={() => onDelete(doc.id)}
          className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
