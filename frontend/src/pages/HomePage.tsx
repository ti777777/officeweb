import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, Search, FileText } from 'lucide-react'
import { documentsApi } from '../api/documents'
import type { Document } from '../types'
import DocumentCard from '../components/documents/DocumentCard'
import UploadModal from '../components/documents/UploadModal'

export default function HomePage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchDocuments() }, [fetchDocuments])

  const handleUploaded = (doc: Document) => {
    toast.success(`${doc.fileName} uploaded successfully`)
    setShowUpload(false)
    setDocuments(prev => [doc, ...prev])
  }

  const handleDelete = async (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (!confirm(`Are you sure you want to delete "${doc?.fileName}"?`)) return
    try {
      await documentsApi.delete(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`)
  }

  const filtered = documents.filter(d =>
    d.fileName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            {documents.length} document(s)
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => void fetchDocuments()}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="mt-3 h-8 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">
            {search ? 'No matching documents' : 'No documents yet'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Click "Upload" to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              onEdit={handleEdit}
              downloadUrl={documentsApi.downloadUrl(doc.id)}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      )}
    </div>
  )
}
