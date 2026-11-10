import { useEffect, useState } from "react"
import { BookOpen, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { Entry } from "@/lib/types"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [newSection, setNewSection] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [creating, setCreating] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api<Entry[]>("/knowledge-base").then((loaded) => {
      setEntries(loaded)
      if (loaded.length > 0) {
        select(loaded[0])
      }
    })
  }, [])

  const sections = [...new Set(entries?.map((entry) => entry.section) ?? [])]

  function select(entry: Entry) {
    setSelectedId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
  }

  async function save() {
    if (selectedId === null) return
    setSaving(true)
    try {
      const updated = await api<Entry>(`/knowledge-base/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      })
      setEntries((current) =>
        current ? current.map((entry) => (entry.id === updated.id ? updated : entry)) : current
      )
      toast.success("Saved")
    } catch {
      toast.error("Couldn't save the entry")
    } finally {
      setSaving(false)
    }
  }

  async function createEntry() {
    if (!newSection.trim() || !newTitle.trim()) return
    setCreating(true)
    try {
      const created = await api<Entry>("/knowledge-base", {
        method: "POST",
        body: JSON.stringify({
          section: newSection.trim(),
          title: newTitle.trim(),
          content: newContent,
        }),
      })
      setEntries((current) => (current ? [...current, created] : [created]))
      select(created)
      setCreateOpen(false)
      setNewSection("")
      setNewTitle("")
      setNewContent("")
      toast.success("Entry created")
    } catch {
      toast.error("Couldn't create the entry — a title like that may already exist in this section")
    } finally {
      setCreating(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api(`/knowledge-base/${deleteTarget.id}`, { method: "DELETE" })
      setEntries((current) => {
        const remaining = current?.filter((entry) => entry.id !== deleteTarget.id) ?? null
        if (selectedId === deleteTarget.id) {
          if (remaining && remaining.length > 0) {
            select(remaining[0])
          } else {
            setSelectedId(null)
            setTitle("")
            setContent("")
          }
        }
        return remaining
      })
      toast.success("Entry deleted")
      setDeleteTarget(null)
    } catch {
      toast.error("Couldn't delete the entry")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="min-h-0 gap-2 py-3">
        <div className="px-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="size-4" />
                New entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New knowledge base entry</DialogTitle>
                <DialogDescription>
                  Relay reads this before answering a customer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-section">Section</Label>
                  <Input
                    id="new-section"
                    list="kb-sections"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    placeholder="e.g. shipping"
                  />
                  <datalist id="kb-sections">
                    {sections.map((section) => (
                      <option key={section} value={section} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-content">Content</Label>
                  <Textarea
                    id="new-content"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-32 font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={createEntry}
                  disabled={creating || !newSection.trim() || !newTitle.trim()}
                >
                  {creating ? "Creating..." : "Create entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-2">
          <div className="flex flex-col gap-4 pb-2">
            {entries === null &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            {sections.map((section) => (
              <div key={section}>
                <p className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {section.replace(/-/g, " ")}
                </p>
                {entries
                  ?.filter((entry) => entry.section === section)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className={`group flex items-center rounded-md pr-1 transition-colors hover:bg-muted ${
                        entry.id === selectedId ? "bg-muted" : ""
                      }`}
                    >
                      <button
                        onClick={() => select(entry)}
                        className={`block min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm ${
                          entry.id === selectedId ? "font-medium" : ""
                        }`}
                      >
                        {entry.title}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(entry)
                        }}
                        aria-label={`Delete ${entry.title}`}
                        className="shrink-0 rounded p-1 text-muted-foreground opacity-40 transition-opacity hover:text-destructive hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="min-h-0 p-6">
        {selectedId === null ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <BookOpen className="size-8" />
            <p>
              {entries === null ? "Loading knowledge base..." : "Select an entry to edit it."}
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-0 flex-1 resize-none font-mono text-sm"
            />
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Relay reads this before answering a customer.
              </p>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Relay will no longer use this entry when answering customers. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
