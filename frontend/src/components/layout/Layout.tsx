import { Outlet } from 'react-router-dom'
import { WorkspaceProvider } from '../../contexts/WorkspaceContext'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>
    </WorkspaceProvider>
  )
}
