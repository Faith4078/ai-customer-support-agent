import { useEffect, useState } from "react"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatDate, type SupportEvent } from "@/lib/types"

export function EventsPage() {
  const [events, setEvents] = useState<SupportEvent[] | null>(null)
  const [checking, setChecking] = useState(false)

  const load = () => api<SupportEvent[]>("/events").then(setEvents)

  useEffect(() => {
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [])

  async function checkInbox() {
    setChecking(true)
    try {
      const result = await api<{ messages: number }>("/poll", { method: "POST" })
      await load()
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every email Relay has seen, newest first.
        </p>
        <Button onClick={checkInbox} disabled={checking}>
          {checking ? "Checking..." : "Check inbox now"}
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="flex flex-col divide-y p-0">
          {events === null &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          {events !== null && events.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No activity yet. Check the inbox to get started.
            </p>
          )}
          {events?.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  Message {event.gmail_message_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.created_at)}
                  {event.attempts > 1 && ` · attempt ${event.attempts}`}
                </p>
                {event.error && (
                  <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400">
                    {event.error}
                  </p>
                )}
              </div>
              <StatusBadge status={event.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
