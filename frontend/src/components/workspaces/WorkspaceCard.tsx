import { useState, useRef, useEffect } from 'react'
import { Users, Folder, Trash2, Pencil, Check, X } from 'lucide-react'
import type { Workspace } from '../../types'

interface Props {
  workspace: Workspace
  currentUserId: string
  onClick: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => Promise<void>
}

export default function WorkspaceCard({ workspace, currentUserId, onClick, onDelete, onRename }: Props) {
  const isOwner = workspace.members.some(m => m.userId === currentUserId && m.role === 'Owner')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(workspace.name)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const handleSave = async () => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === workspace.name) { handleCancel(); return }
    setSaving(true)
    try {
      await onRename(workspace.id, trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(workspace.name)
    setEditing(false)
  }

  return (
    <div
      onClick={editing ? undefined : onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg">
          <Folder className="w-6 h-6 text-primary-600" />
        </div>
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
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
              {workspace.name}
            </p>
          )}
          {workspace.description && !editing && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{workspace.description}</p>
          )}
        </div>
        {isOwner && !editing && (
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Rename workspace"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(workspace.id) }}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete workspace"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {editing && (
          <div className="flex-shrink-0 flex items-center gap-1">
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
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Users className="w-3.5 h-3.5" />
        <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
