import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { documentsApi } from '../api/documents'
import WopiEditor, { type WopiEditorProps } from '../components/editors/WopiEditor'
import { Button } from '@/components/ui/button'

function buildActionUrl(rawUrl: string, wopiSrc: string): string {
  const encodedSrc = encodeURIComponent(wopiSrc)
  if (rawUrl.includes('{WOPISrc}')) {
    return rawUrl.replace('{WOPISrc}', encodedSrc)
  }
  const sep = rawUrl.includes('?') ? '&' : '?'
  return `${rawUrl}${sep}WOPISrc=${encodedSrc}`
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wopiProps, setWopiProps] = useState<WopiEditorProps | null>(null)

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
    <div className="fixed inset-0 flex flex-col bg-muted">
      {loading && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading editor…</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-destructive font-medium">Load failed</p>
          <p className="text-sm text-muted-foreground max-w-sm text-center">{error}</p>
          <Button onClick={() => window.close()} size="sm">
            Close
          </Button>
        </div>
      )}

      {!loading && !error && wopiProps && (
        <WopiEditor {...wopiProps} />
      )}
    </div>
  )
}
