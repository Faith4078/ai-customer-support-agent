import { useEffect, useState } from "react"
import { Activity, CheckCircle2, Inbox, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { Page } from "@/lib/nav"
import { formatDate, type SupportEvent, type Ticket } from "@/lib/types"

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export function OverviewPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [events, setEvents] = useState<SupportEvent[] | null>(null)
  const [checking, setChecking] = useState(false)

  function load() {
    api<Ticket[]>("/tickets").then(setTickets)
    api<SupportEvent[]>("/events").then(setEvents)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [])

  async function checkInbox() {
    setChecking(true)
    try {
      const result = await api<{ messages: number }>("/poll", { method: "POST" })
      load()
      toast.success(
        result.messages > 0
          ? `Picked up ${result.messages} new email${result.messages === 1 ? "" : "s"}`
          : "No new emails right now"
      )
    } catch {
      toast.error("Couldn't reach the inbox")
    } finally {
      setChecking(false)
    }
  }

  const loading = tickets === null || events === null
  const open = tickets?.filter((t) => t.status === "open").length ?? 0
  const escalated = tickets?.filter((t) => t.status === "escalated").length ?? 0
  const answered = tickets?.filter((t) => t.status === "answered").length ?? 0
  const closed = tickets?.filter((t) => t.status === "closed").length ?? 0
  const resolved = answered + closed
  const processedToday =
    events?.filter((e) => e.status === "processed" && isToday(e.created_at)).length ?? 0
  const automationRate = tickets?.length ? Math.round((resolved / tickets.length) * 100) : 0

  const stats = [
    {
      label: "Processed today",
      value: processedToday,
      icon: Activity,
      hint: `${events?.length ?? 0} emails total`,
    },
    {
      label: "Open tickets",
      value: open,
      icon: Inbox,
      hint: "waiting on a reply",
    },
    {
      label: "Needs a human",
      value: escalated,
      icon: TriangleAlert,
      hint: "escalated by Relay",
      warn: escalated > 0,
    },
    {
      label: "Resolved",
      value: `${automationRate}%`,
      icon: CheckCircle2,
      hint: `${resolved} of ${tickets?.length ?? 0} tickets`,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-ai-border bg-ai">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium text-ai-foreground">
              Relay is watching the support inbox
            </p>
            <p className="text-sm text-ai-foreground/70">
              New emails are triaged automatically. Trigger a manual check any time.
            </p>
          </div>
          <Button onClick={checkInbox} disabled={checking}>
            {checking ? "Checking inbox..." : "Check inbox now"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon
                className={`size-4 ${stat.warn ? "text-amber-600" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold">{stat.value}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            {!loading && tickets!.length === 0 && (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            )}
            {tickets?.slice(0, 5).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onNavigate("inbox")}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.subject || "(no subject)"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.customer_email}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            {!loading && events!.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {events?.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <span className="truncate text-muted-foreground">
                  Message {event.gmail_message_id}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={event.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
