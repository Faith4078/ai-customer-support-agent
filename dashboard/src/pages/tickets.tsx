import { useEffect, useMemo, useState } from "react"
import { CheckCheck, LayoutGrid, List, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { KanbanBoard } from "@/components/kanban-board"
import { MessageBody } from "@/components/message-body"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { formatDate, type Message, type ReplyResult, type Ticket } from "@/lib/types"

const STATUS_FILTERS = [
  { value: "all", label: "All tickets" },
  { value: "escalated", label: "Needs a human" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
]

const TICKETS_POLL_MS = 5000
const MESSAGES_POLL_MS = 3000

function initials(email: string) {
  const name = email.split("@")[0] ?? email
  return name.slice(0, 2).toUpperCase()
}

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [view, setView] = useState<"list" | "board">("list")
  const [resolving, setResolving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    function load() {
      api<Ticket[]>("/tickets").then((loaded) => {
        setTickets(loaded)
        setSelectedId((current) => current ?? (loaded.length > 0 ? loaded[0].id : null))
      })
    }
    load()
    const interval = setInterval(load, TICKETS_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setReply("")
    if (selectedId === null) {
      setMessages([])
      return
    }
    function load() {
      api<Message[]>(`/tickets/${selectedId}/messages`).then(setMessages)
    }
    load()
    const interval = setInterval(load, MESSAGES_POLL_MS)
    return () => clearInterval(interval)
  }, [selectedId])

  const filtered = useMemo(() => {
    if (!tickets) return []
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        ticket.subject.toLowerCase().includes(q) ||
        ticket.customer_email.toLowerCase().includes(q)
      )
    })
  }, [tickets, search, statusFilter])

  const selected = tickets?.find((t) => t.id === selectedId) ?? null

  async function updateStatus(ticketId: number, status: string) {
    try {
      const updated = await api<Ticket>(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setTickets((current) =>
        current ? current.map((t) => (t.id === updated.id ? updated : t)) : current
      )
      return updated
    } catch {
      toast.error("Couldn't update the ticket")
      return null
    }
  }

  async function approveSuggestion() {
    if (!selected) return
    setResolving(true)
    const updated = await updateStatus(selected.id, "answered")
    setResolving(false)
    if (updated) toast.success("Marked as resolved")
  }

  async function closeTicket() {
    if (!selected) return
    setClosing(true)
    const updated = await updateStatus(selected.id, "closed")
    setClosing(false)
    if (updated) toast.success("Ticket closed")
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const result = await api<ReplyResult>(`/tickets/${selected.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      })
      setMessages((current) => [...current, result.message])
      setTickets((current) =>
        current
          ? current.map((t) => (t.id === selected.id ? { ...t, status: "answered" } : t))
          : current
      )
      setReply("")
      toast.success(
        result.delivered
          ? "Reply sent"
          : "Saved to the ticket — couldn't reach Gmail to actually send it"
      )
    } catch {
      toast.error("Couldn't send the reply")
    } finally {
      setSending(false)
    }
  }

  function openFromBoard(id: number) {
    setSelectedId(id)
    setView("list")
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
            List
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
          >
            <LayoutGrid className="size-4" />
            Board
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <KanbanBoard tickets={tickets ?? []} onOpen={openFromBoard} onStatusChange={updateStatus} />
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="flex min-h-0 flex-col gap-0 py-3">
            <div className="flex flex-col gap-2 px-3 pb-3">
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-1 px-2 pb-2">
                {tickets === null &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                {tickets !== null && filtered.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No tickets match.
                  </p>
                )}
                {filtered.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    className={`flex flex-col gap-1.5 rounded-md border p-3 text-left text-sm transition-colors ${
                      ticket.id === selectedId
                        ? "border-transparent bg-muted"
                        : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 shrink-0">
                        <AvatarFallback className="text-[10px]">
                          {initials(ticket.customer_email)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 flex-1 truncate font-medium">
                        {ticket.subject || "(no subject)"}
                      </p>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 pl-8">
                      <span className="truncate text-xs text-muted-foreground">
                        {ticket.customer_email}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="flex min-h-0 flex-col py-0">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                {tickets === null ? "Loading tickets..." : "Select a ticket to read the conversation."}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-3 border-b p-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{selected.subject || "(no subject)"}</h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {selected.customer_email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {selected.category && (
                      <Badge variant="secondary">{selected.category}</Badge>
                    )}
                    <StatusBadge status={selected.status} />
                    {selected.status !== "closed" && (
                      <Button variant="outline" size="sm" onClick={closeTicket} disabled={closing}>
                        <CheckCheck className="size-4" />
                        {closing ? "Closing..." : "Close"}
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="flex flex-col gap-3 p-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={
                          message.direction === "out"
                            ? "ml-10 rounded-lg bg-primary p-3 text-primary-foreground"
                            : "mr-10 rounded-lg border p-3"
                        }
                      >
                        <p className="mb-1 text-xs opacity-70">
                          {message.from_address}, {formatDate(message.created_at)}
                        </p>
                        <MessageBody text={message.body} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t">
                  {selected.status === "escalated" && selected.proposed_action && (
                    <div className="bg-ai p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-border/60">
                          <Sparkles className="size-4 text-ai-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-ai-foreground">
                            Relay suggests
                          </p>
                          <p className="mt-1 text-sm text-ai-foreground/90">
                            {selected.proposed_action}
                          </p>
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={approveSuggestion}
                            disabled={resolving}
                          >
                            {resolving ? "Approving..." : "Approve & resolve"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2 p-4">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply to the customer..."
                      className="min-h-16 flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          sendReply()
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      aria-label="Send reply"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
