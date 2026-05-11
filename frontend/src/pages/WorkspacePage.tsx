import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Check, ChevronRight, Folder as FolderIcon, FolderPlus,
  MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, Users, FileText, X, UserMinus, Home,
} from 'lucide-react'
import { workspacesApi } from '@/api/workspaces'
import { documentsApi } from '@/api/documents'
import { foldersApi } from '@/api/folders'
import type { Workspace, Document, Folder } from '@/types'
import DocumentCard from '@/components/documents/DocumentCard'
import UploadModal from '@/components/documents/UploadModal'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      className={cn(
        'group bg-card border rounded-lg p-4 flex flex-col gap-2 cursor-pointer',
        'hover:border-primary/40 hover:shadow-sm transition-all duration-150',
        editing && 'border-primary/40',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
          <FolderIcon className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
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
              className="w-full text-sm font-medium bg-transparent border border-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="text-sm font-medium truncate">{folder.name}</p>
          )}
          {!editing && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(folder.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); void handleSave() }}
              disabled={saving || !editName.trim()}
              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleCancel() }}
              disabled={saving}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditing(true) }}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function CreateFolderDialog({ open, onClose, onCreated, workspaceId }: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  workspaceId: string
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
      setName('')
      onCreated()
    } catch {
      toast.error('Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !loading) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => void handleSubmit(e)}>
          <div className="px-6 py-4">
            <Label htmlFor="folder-name" className="mb-1.5 block">Folder name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Reports"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MembersDialog({ workspace, currentUserId, open, onClose, onUpdated }: {
  workspace: Workspace
  currentUserId: string
  open: boolean
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
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <ul className="space-y-1">
            {workspace.members.map(m => (
              <li key={m.userId} className="flex items-center gap-3 py-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {m.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{m.username}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={m.role === 'Owner' ? 'accent' : 'secondary'} className="text-[10px]">
                    {m.role}
                  </Badge>
                  {((isOwner && m.userId !== currentUserId) || (m.userId === currentUserId && m.role !== 'Owner')) && (
                    <button
                      onClick={() => void handleRemove(m.userId, m.username)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title={m.userId === currentUserId ? 'Leave workspace' : 'Remove member'}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isOwner && (
            <>
              <Separator />
              <form onSubmit={e => void handleAdd(e)} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Username or email"
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!input.trim() || loading}>
                  Add
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MoveDocumentDialog({ doc, folders, open, onClose, onMoved }: {
  doc: Document | null
  folders: Folder[]
  open: boolean
  onClose: () => void
  onMoved: (updatedDoc: Document) => void
}) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    if (doc) setSelectedFolderId(doc.folderId)
  }, [doc])

  const handleMove = async () => {
    if (!doc) return
    setMoving(true)
    try {
      const updated = await documentsApi.move(doc.id, selectedFolderId)
      toast.success(`Moved to ${folders.find(f => f.id === selectedFolderId)?.name ?? 'workspace root'}`)
      onMoved(updated)
    } catch {
      toast.error('Failed to move document')
    } finally {
      setMoving(false)
    }
  }

  const unchanged = selectedFolderId === (doc?.folderId ?? null)

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !moving) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-1 max-h-72 overflow-y-auto">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
              selectedFolderId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-foreground',
            )}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="font-medium">Workspace root</span>
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                selectedFolderId === folder.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground',
              )}
            >
              <FolderIcon className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={moving}>
            Cancel
          </Button>
          <Button onClick={() => void handleMove()} disabled={moving || unchanged}>
            {moving ? 'Moving…' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [moveDoc, setMoveDoc] = useState<Document | null>(null)

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
    toast.success(`${doc.fileName} uploaded`)
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
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!workspace) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mt-0.5 h-8 w-8 shrink-0"
            title="Back to workspaces"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{workspace.description}</p>
            )}
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMembers(true)}>
            <Users />
            {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void fetchData()}
            title="Refresh"
            className="h-8 w-8"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus />
            New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus />
            Upload
          </Button>
        </div>
      </div>

      {activeFolder && (
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => { setActiveFolder(null); setSearch('') }}
            className="text-primary hover:underline underline-offset-4 font-medium transition-colors"
          >
            {workspace.name}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{activeFolder.name}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={activeFolder ? `Search in ${activeFolder.name}…` : 'Search folders and documents…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-base font-semibold">
            {search ? 'No matching items' : activeFolder ? 'Folder is empty' : 'Nothing here yet'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Try a different search term' : 'Use "New Folder" or "Upload" to add content'}
          </p>
          {!search && (
            <Button onClick={() => setShowUpload(true)} className="mt-5" size="sm">
              <Plus />
              Upload document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
              onMove={setMoveDoc}
              downloadUrl={documentsApi.downloadUrl(doc.id)}
            />
          ))}
        </div>
      )}

      {showCreateFolder && id && (
        <CreateFolderDialog
          open={showCreateFolder}
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

      {workspace && (
        <MembersDialog
          workspace={workspace}
          currentUserId={user?.id ?? ''}
          open={showMembers}
          onClose={() => setShowMembers(false)}
          onUpdated={() => {
            setShowMembers(false)
            void fetchData()
          }}
        />
      )}

      <MoveDocumentDialog
        doc={moveDoc}
        folders={folders}
        open={moveDoc !== null}
        onClose={() => setMoveDoc(null)}
        onMoved={updated => {
          setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
          setMoveDoc(null)
        }}
      />
    </div>
  )
}
