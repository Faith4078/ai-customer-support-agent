import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Ticket } from "@/lib/types"

function shortDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

const COLUMNS = [
  { status: "open", label: "Open" },
  { status: "escalated", label: "Needs a human" },
  { status: "answered", label: "Answered" },
  { status: "closed", label: "Closed" },
]

function initials(email: string) {
  const name = email.split("@")[0] ?? email
  return name.slice(0, 2).toUpperCase()
}

export function KanbanBoard({
  tickets,
  onOpen,
  onStatusChange,
}: {
  tickets: Ticket[]
  onOpen: (id: number) => void
  onStatusChange: (id: number, status: string) => void
}) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const items = tickets.filter((ticket) => ticket.status === column.status)
        return (
          <div
            key={column.status}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(column.status)
            }}
            onDragLeave={() => setDragOver((current) => (current === column.status ? null : current))}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(null)
              const id = Number(e.dataTransfer.getData("text/ticket-id"))
              if (id) onStatusChange(id, column.status)
            }}
            className={`flex min-h-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
              dragOver === column.status ? "border-primary bg-muted/60" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-sm font-medium">{column.label}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="p-4 text-center text-xs text-muted-foreground">No tickets</p>
              )}
              {items.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/ticket-id", String(ticket.id))
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onClick={() => onOpen(ticket.id)}
                  className="cursor-grab rounded-md border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {initials(ticket.customer_email)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate font-medium">
                      {ticket.subject || "(no subject)"}
                    </p>
                  </div>
                  <p className="mt-1 truncate pl-7 text-xs text-muted-foreground">
                    {ticket.customer_email}
                  </p>
                  <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                    {ticket.category ? (
                      <Badge variant="outline" className="min-w-0 truncate text-[10px]">
                        {ticket.category}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {shortDate(ticket.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
