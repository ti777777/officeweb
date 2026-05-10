import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, RefreshCw, Search, Users, FileText, X, UserMinus } from 'lucide-react'
import { workspacesApi } from '../api/workspaces'
import { documentsApi } from '../api/documents'
import type { Workspace, Document } from '../types'
import DocumentCard from '../components/documents/DocumentCard'
import UploadModal from '../components/documents/UploadModal'
import { useAuth } from '../contexts/AuthContext'

function MembersModal({ workspace, currentUserId, onClose, onUpdated }: {
  workspace: Workspace
  currentUserId: string
  onClose: () => void
  onUpdated: () => void
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const isOwner = workspace.members.some(m => m.userId === currentUserId && m.role === 'Owner')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    try {
      await workspacesApi.addMember(workspace.id, input.trim())
      toast.success('Member added')
      setInput('')
      onUpdated()
    } catch {
      toast.error('User not found or already a member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (userId: string, username: string) => {
    if (!confirm(`Remove ${username} from this workspace?`)) return
    try {
      await workspacesApi.removeMember(workspace.id, userId)
      toast.success('Member removed')
      onUpdated()
    } catch {
      toast.error('Failed to remove member')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <ul className="divide-y divide-gray-100">
            {workspace.members.map(m => (
              <li key={m.userId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.username}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.role === 'Owner'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.role}
                  </span>
                  {isOwner && m.userId !== currentUserId && (
                    <button
                      onClick={() => void handleRemove(m.userId, m.username)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                  {m.userId === currentUserId && m.role !== 'Owner' && (
                    <button
                      onClick={() => void handleRemove(m.userId, m.username)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Leave workspace"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isOwner && (
            <form onSubmit={e => void handleAdd(e)} className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Username or email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [ws, docs] = await Promise.all([
        workspacesApi.get(id),
        workspacesApi.listDocuments(id),
      ])
      setWorkspace(ws)
      setDocuments(docs)
    } catch {
      toast.error('Failed to load workspace')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleUploaded = (doc: Document) => {
    toast.success(`${doc.fileName} uploaded successfully`)
    setShowUpload(false)
    setDocuments(prev => [doc, ...prev])
  }

  const handleDelete = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!confirm(`Delete "${doc?.fileName}"?`)) return
    try {
      await documentsApi.delete(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const filtered = documents.filter(d =>
    d.fileName.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-28" />
          ))}
        </div>
      </div>
    )
  }

  if (!workspace) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Back to workspaces"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-gray-500 mt-0.5">{workspace.description}</p>
            )}
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={() => void fetchData()}
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">
            {search ? 'No matching documents' : 'No documents yet'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Click "Upload" to add documents'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              onEdit={docId => navigate(`/editor/${docId}`)}
              onPreview={docId => navigate(`/pdf/${docId}`)}
              downloadUrl={documentsApi.downloadUrl(doc.id)}
            />
          ))}
        </div>
      )}

      {showUpload && id && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          uploadFn={(file, onProgress) => workspacesApi.uploadDocument(id, file, onProgress)}
        />
      )}

      {showMembers && workspace && (
        <MembersModal
          workspace={workspace}
          currentUserId={user?.id ?? ''}
          onClose={() => setShowMembers(false)}
          onUpdated={() => {
            setShowMembers(false)
            void fetchData()
          }}
        />
      )}

    </div>
  )
}
