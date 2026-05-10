import { Users, Folder, Trash2 } from 'lucide-react'
import type { Workspace } from '../../types'

interface Props {
  workspace: Workspace
  currentUserId: string
  onClick: () => void
  onDelete: (id: string) => void
}

export default function WorkspaceCard({ workspace, currentUserId, onClick, onDelete }: Props) {
  const isOwner = workspace.members.some(m => m.userId === currentUserId && m.role === 'Owner')

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg">
          <Folder className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {workspace.name}
          </p>
          {workspace.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{workspace.description}</p>
          )}
        </div>
        {isOwner && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(workspace.id) }}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete workspace"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Users className="w-3.5 h-3.5" />
        <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
