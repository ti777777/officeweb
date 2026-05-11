import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Check, ChevronRight, Folder as FolderIcon, FolderPlus,
  Pencil, Plus, RefreshCw, Search, Trash2, Users, FileText, X, UserMinus,
} from 'lucide-react'
import { workspacesApi } from '../api/workspaces'
import { documentsApi } from '../api/documents'
import { foldersApi } from '../api/folders'
import type { Workspace, Document, Folder } from '../types'
import DocumentCard from '../components/documents/DocumentCard'
import UploadModal from '../components/documents/UploadModal'
import { useAuth } from '../contexts/AuthContext'

function FolderCard({ folder, onOpen, onDelete, onRename }: {
  folder: Folder
  onOpen: () => void
  onDelete: () => void
  onRename: (name: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const handleSave = async () => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === folder.name) { handleCancel(); return }
    setSaving(true)
    try {
      await onRename(trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(folder.name)
    setEditing(false)
  }

  return (
    <div
      onClick={editing ? undefined : onOpen}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <FolderIcon className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') void handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              onClick={e => e.stopPropagation()}
              disabled={saving}
              className="w-full text-sm font-semibold text-gray-900 border border-primary-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
          )}
          {!editing && (
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(folder.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
        {editing ? (
          <>
            <button
              onClick={e => { e.stopPropagation(); void handleSave() }}
              disabled={saving || !editName.trim()}
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleCancel() }}
              disabled={saving}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Rename folder"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="ml-auto flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete folder"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function CreateFolderModal({ workspaceId, onClose, onCreated }: {
  workspaceId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await foldersApi.create(workspaceId, name.trim())
      toast.success('Folder created')
      onCreated()
    } catch {
      toast.error('Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={e => void handleSubmit(e)} className="p-6 space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

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

  return createPortal(
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
    </div>,
    document.body,
  )
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [ws, docs, folderList] = await Promise.all([
        workspacesApi.get(id),
        workspacesApi.listDocuments(id),
        foldersApi.list(id),
      ])
      setWorkspace(ws)
      setDocuments(docs)
      setFolders(folderList)
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

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}"? Documents inside will be moved to the workspace root.`)) return
    try {
      await foldersApi.delete(id!, folder.id)
      setFolders(prev => prev.filter(f => f.id !== folder.id))
      setDocuments(prev => prev.map(d => d.folderId === folder.id ? { ...d, folderId: null } : d))
      if (activeFolder?.id === folder.id) setActiveFolder(null)
      toast.success('Folder deleted')
    } catch {
      toast.error('Failed to delete folder')
    }
  }

  const handleRenameFolder = async (folder: Folder, name: string) => {
    try {
      await foldersApi.rename(id!, folder.id, name)
      setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name } : f))
      if (activeFolder?.id === folder.id) setActiveFolder(prev => prev ? { ...prev, name } : prev)
      toast.success('Folder renamed')
    } catch {
      toast.error('Rename failed')
      throw new Error('rename failed')
    }
  }

  const handleFolderCreated = async () => {
    setShowCreateFolder(false)
    if (!id) return
    setFolders(await foldersApi.list(id))
  }

  const currentFolderId = activeFolder?.id ?? null
  const filteredFolders = activeFolder
    ? []
    : folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const filteredDocuments = documents
    .filter(d => d.folderId === currentFolderId)
    .filter(d => d.fileName.toLowerCase().includes(search.toLowerCase()))
  const isEmpty = filteredFolders.length === 0 && filteredDocuments.length === 0

  const uploadFn = activeFolder && id
    ? (file: File, onProgress: (pct: number) => void) =>
        foldersApi.uploadDocument(id, activeFolder.id, file, onProgress)
    : id
      ? (file: File, onProgress: (pct: number) => void) =>
          workspacesApi.uploadDocument(id, file, onProgress)
      : undefined

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
      {/* Header */}
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
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
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

      {/* Breadcrumb */}
      {activeFolder && (
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => { setActiveFolder(null); setSearch('') }}
            className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            {workspace.name}
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{activeFolder.name}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder={activeFolder ? `Search in ${activeFolder.name}...` : 'Search folders and documents...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Grid */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">
            {search ? 'No matching items' : activeFolder ? 'Folder is empty' : 'Nothing here yet'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Use "New Folder" or "Upload" to add content'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFolders.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onOpen={() => { setActiveFolder(folder); setSearch('') }}
              onDelete={() => void handleDeleteFolder(folder)}
              onRename={name => handleRenameFolder(folder, name)}
            />
          ))}
          {filteredDocuments.map(doc => (
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

      {showCreateFolder && id && (
        <CreateFolderModal
          workspaceId={id}
          onClose={() => setShowCreateFolder(false)}
          onCreated={() => void handleFolderCreated()}
        />
      )}

      {showUpload && uploadFn && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          uploadFn={uploadFn}
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
