import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { documentsApi } from '../api/documents'

export default function PdfPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let url: string | null = null

    const load = async () => {
      try {
        const [doc, blob] = await Promise.all([
          documentsApi.get(id),
          documentsApi.getBlob(id),
        ])
        setFileName(doc.fileName)
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch {
        setError('Failed to load PDF')
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [id])

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{fileName}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm">Loading PDF…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-red-600 font-medium">Load failed</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Back
            </button>
          </div>
        )}

        {blobUrl && (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        )}
      </div>
    </div>
  )
}
