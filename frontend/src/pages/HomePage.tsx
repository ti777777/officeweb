import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, LayoutGrid } from 'lucide-react'
import { workspacesApi } from '@/api/workspaces'
import type { Workspace } from '@/types'
import WorkspaceCard from '@/components/workspaces/WorkspaceCard'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

function CreateWorkspaceDialog({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (w: Workspace) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const workspace = await workspacesApi.create(name.trim(), description.trim() || undefined)
      onCreated(workspace)
      setName('')
      setDescription('')
    } catch {
      toast.error('Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !loading) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => void handleSubmit(e)}>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Marketing Team"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">
                Description
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="ws-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? 'Creating…' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const data = await workspacesApi.list()
      setWorkspaces(data)
    } catch {
      toast.error('Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchWorkspaces() }, [fetchWorkspaces])

  const handleCreated = (workspace: Workspace) => {
    toast.success(`"${workspace.name}" created`)
    setShowCreate(false)
    setWorkspaces(prev => [workspace, ...prev])
  }

  const handleDelete = async (id: string) => {
    const ws = workspaces.find(w => w.id === id)
    if (!confirm(`Delete workspace "${ws?.name}"? This cannot be undone.`)) return
    try {
      await workspacesApi.delete(id)
      setWorkspaces(prev => prev.filter(w => w.id !== id))
      toast.success('Workspace deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleRename = async (id: string, name: string) => {
    try {
      const updated = await workspacesApi.rename(id, name)
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: updated.name } : w))
      toast.success('Workspace renamed')
    } catch {
      toast.error('Rename failed')
      throw new Error('rename failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Workspaces</h1>
            {!loading && (
              <p className="text-xs text-muted-foreground mt-1">
                {workspaces.length === 0 ? 'No workspaces yet' : `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void fetchWorkspaces()}
            title="Refresh"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus />
            New Workspace
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-1/3 mt-4" />
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-base font-semibold">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Create a workspace to organize your team's documents
          </p>
          <Button onClick={() => setShowCreate(true)} className="mt-5" size="sm">
            <Plus />
            New Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workspaces.map(ws => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              currentUserId={user?.id ?? ''}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      <CreateWorkspaceDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
