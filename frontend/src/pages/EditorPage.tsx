import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { documentsApi } from '../api/documents'
import WopiEditor, { type WopiEditorProps } from '../components/editors/WopiEditor'

function buildActionUrl(rawUrl: string, wopiSrc: string): string {
  const encodedSrc = encodeURIComponent(wopiSrc)
  if (rawUrl.includes('{WOPISrc}')) {
    return rawUrl.replace('{WOPISrc}', encodedSrc)
  }
  const sep = rawUrl.includes('?') ? '&' : '?'
  return `${rawUrl}${sep}WOPISrc=${encodedSrc}`
}

function triggerEditorSave() {
  const frame = document.querySelector<HTMLIFrameElement>('iframe[name="wopi-frame"]')
  if (!frame?.contentWindow) return
  try {
    frame.contentWindow.postMessage(JSON.stringify({ MessageId: 'save' }), '*')
  } catch {
    // cross-origin errors are expected and safe to ignore
  }
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [wopiProps, setWopiProps] = useState<WopiEditorProps | null>(null)
  const [savingBack, setSavingBack] = useState(false)
  const navigateAfterSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      try {
        const data: Record<string, unknown> =
          typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
        const isSaved =
          data.MessageId === 'Action_Save_Resp' &&
          (data.Values as Record<string, unknown>)?.success === true
        if (savingBack && isSaved) {
          if (navigateAfterSave.current) clearTimeout(navigateAfterSave.current)
          navigate('/')
        }
      } catch {
        // ignore non-JSON or unrelated messages
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [savingBack, navigate])

  useEffect(() => () => {
    if (navigateAfterSave.current) clearTimeout(navigateAfterSave.current)
  }, [])

  const handleBack = useCallback(() => {
    if (!wopiProps) { navigate('/'); return }
    setSavingBack(true)
    triggerEditorSave()
    navigateAfterSave.current = setTimeout(() => navigate('/'), 1500)
  }, [wopiProps, navigate])

  useEffect(() => {
    if (!id) return

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tokenInfo, doc] = await Promise.all([
          documentsApi.getWopiToken(id),
          documentsApi.get(id),
        ])

        const ext = doc.fileName.split('.').pop() ?? 'docx'
        const { url: rawUrl } = await documentsApi.getWopiActionUrl(ext)
        const actionUrl = buildActionUrl(rawUrl, tokenInfo.wopi_src)

        console.debug('[WOPI] rawUrl:', rawUrl)
        console.debug('[WOPI] wopi_src:', tokenInfo.wopi_src)
        console.debug('[WOPI] actionUrl:', actionUrl)

        setFileName(doc.fileName)
        setWopiProps({
          actionUrl,
          accessToken: tokenInfo.access_token,
          accessTokenTtl: tokenInfo.access_token_ttl,
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load editor'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [id])

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <button
          onClick={handleBack}
          disabled={savingBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-60"
        >
          {savingBack ? (
            <>
              <Save className="w-4 h-4 animate-pulse" />
              Saving…
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              Back
            </>
          )}
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{fileName}</span>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm">Loading editor…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-red-600 font-medium">Load failed</p>
            <p className="text-sm text-gray-500 max-w-sm text-center">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Back to documents
            </button>
          </div>
        )}

        {!loading && !error && wopiProps && (
          <WopiEditor {...wopiProps} />
        )}
      </div>
    </div>
  )
}
