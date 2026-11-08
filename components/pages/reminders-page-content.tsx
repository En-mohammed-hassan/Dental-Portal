"use client"

import { addDays, addMonths, format, parseISO } from "date-fns"
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Plus,
  UsersRound,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { type PatientProfile, type ReservationStatus } from "@/types/patient"
import { reservationStatusBadgeClass } from "@/utils/patient"

type Reminder = {
  id: string
  patientId: string
  patientName: string
  patientPhone: string | null
  dueOn: string
  status: string
  note: string | null
  reservationId: string | null
  createdAt: string
  resolvedAt: string | null
}

type ReminderData = {
  overdue: Reminder[]
  due: Reminder[]
  upcoming: Reminder[]
}

type LaserPatient = {
  reservationId: string
  patientId: string
  patientName: string
  patientPhone: string | null
  startsAt: string
  endsAt: string
  status: ReservationStatus
  reminderId: string | null
}

const emptyData: ReminderData = { overdue: [], due: [], upcoming: [] }

function sameSelection(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const right = new Set(b)
  return a.every((value) => right.has(value))
}

export function RemindersPageContent() {
  const { t, i18n } = useTranslation(["admin", "common"])
  const today = useMemo(() => new Date(), [])
  const todayRange = useMemo(() => {
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return { from: from.toISOString(), to: addDays(from, 1).toISOString() }
  }, [today])
  const reminderDueOn = useMemo(() => format(addMonths(today, 1), "yyyy-MM-dd"), [today])

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [data, setData] = useState<ReminderData>(emptyData)
  const [laserPatients, setLaserPatients] = useState<LaserPatient[]>([])
  const [selectedLaserPatientIds, setSelectedLaserPatientIds] = useState<string[]>([])
  const [confirmedLaserPatientIds, setConfirmedLaserPatientIds] = useState<string[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [patientId, setPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [dueOn, setDueOn] = useState(() => format(addMonths(new Date(), 1), "yyyy-MM-dd"))
  const [note, setNote] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        from: todayRange.from,
        to: todayRange.to,
        reminderDueOn,
      })
      const response = await fetch(`/api/admin/reminders?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })
      const payload = (await response.json()) as {
        data?: ReminderData
        laserPatients?: LaserPatient[]
        message?: string
      }
      if (!response.ok) throw new Error(payload.message ?? t("reminders.loadFailed"))

      const nextLaserPatients = payload.laserPatients ?? []
      const confirmed = nextLaserPatients
        .filter((patient) => Boolean(patient.reminderId))
        .map((patient) => patient.patientId)
      setData(payload.data ?? emptyData)
      setLaserPatients(nextLaserPatients)
      setSelectedLaserPatientIds(confirmed)
      setConfirmedLaserPatientIds(confirmed)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reminders.loadFailed"))
      setData(emptyData)
      setLaserPatients([])
      setSelectedLaserPatientIds([])
      setConfirmedLaserPatientIds([])
    } finally {
      setLoading(false)
    }
  }, [reminderDueOn, selectedDate, t, todayRange.from, todayRange.to])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetch("/api/patients", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { data?: PatientProfile[] }) => setPatients(payload.data ?? []))
      .catch(() => setPatients([]))
  }, [])

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase()
    if (!query) return patients
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        (patient.phone?.toLowerCase().includes(query) ?? false)
    )
  }, [patientSearch, patients])

  const laserSelectionChanged = !sameSelection(
    selectedLaserPatientIds,
    confirmedLaserPatientIds
  )

  const create = async (targetPatientId = patientId, targetDueOn = dueOn, targetNote = note) => {
    if (!targetPatientId) {
      toast.error(t("reminders.selectPatient"))
      return
    }
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/reminders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: targetPatientId, dueOn: targetDueOn, note: targetNote }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) throw new Error(payload.message ?? t("reminders.createFailed"))
      toast.success(t("reminders.created"))
      setPatientId("")
      setPatientSearch("")
      setNote("")
      setCreateOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reminders.createFailed"))
    } finally {
      setProcessing(false)
    }
  }

  const resolve = async (id: string, status: "completed" | "dismissed") => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) throw new Error(payload.message ?? t("reminders.updateFailed"))
      toast.success(t("reminders.updated"))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reminders.updateFailed"))
    } finally {
      setProcessing(false)
    }
  }

  const remindNextMonth = async (reminder: Reminder) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/reminders/${reminder.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "remind-next-month", dueOn: reminderDueOn }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) throw new Error(payload.message ?? t("reminders.updateFailed"))
      toast.success(t("reminders.created"))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reminders.updateFailed"))
    } finally {
      setProcessing(false)
    }
  }

  const toggleLaserPatient = (patientIdToToggle: string) => {
    setSelectedLaserPatientIds((current) =>
      current.includes(patientIdToToggle)
        ? current.filter((id) => id !== patientIdToToggle)
        : [...current, patientIdToToggle]
    )
  }

  const saveLaserReminders = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/reminders", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...todayRange,
          reminderDueOn,
          patientIds: selectedLaserPatientIds,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) throw new Error(payload.message ?? t("reminders.selectionSaveFailed"))
      toast.success(t("reminders.selectionSaved"))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reminders.selectionSaveFailed"))
    } finally {
      setProcessing(false)
    }
  }

  const renderReminder = (reminder: Reminder) => (
    <Card key={reminder.id} className="gap-3 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{reminder.patientName}</h3>
            <p className="text-sm text-muted-foreground">
              {reminder.patientPhone ?? t("reminders.noPhone")}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
              parseISO(`${reminder.dueOn}T12:00:00`)
            )}
          </Badge>
        </div>
        {reminder.note && (
          <p className="rounded-lg border bg-muted/60 p-2 text-sm">{reminder.note}</p>
        )}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Button asChild size="sm">
            <Link
              href={`/admin/reservations?newReservation=1&patientId=${encodeURIComponent(reminder.patientId)}&reminderId=${encodeURIComponent(reminder.id)}`}
            >
              <CalendarPlus className="me-1 h-4 w-4" /> {t("reminders.book")}
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={processing}
            onClick={() => void remindNextMonth(reminder)}
          >
            <BellRing className="me-1 h-4 w-4" /> {t("reminders.oneMonth")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={processing}
            onClick={() => void resolve(reminder.id, "completed")}
          >
            <Check className="me-1 h-4 w-4" /> {t("reminders.complete")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={processing}
            onClick={() => void resolve(reminder.id, "dismissed")}
          >
            <X className="me-1 h-4 w-4" /> {t("reminders.dismiss")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("reminders.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("reminders.subtitle")}</p>
      </header>

      <Tabs defaultValue="current" className="gap-4">
        <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:w-fit">
          <TabsTrigger value="current" className="min-h-10 px-3">
            <BellRing className="h-4 w-4" />
            <span className="truncate">{t("reminders.currentView")}</span>
          </TabsTrigger>
          <TabsTrigger value="laser" className="min-h-10 px-3">
            <UsersRound className="h-4 w-4" />
            <span className="truncate">{t("reminders.laserTodayView")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-end sm:justify-between sm:p-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-view-date">{t("reminders.viewDate")}</Label>
              <Input
                id="reminder-view-date"
                type="date"
                className="w-full sm:w-auto"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between sm:w-auto"
              aria-expanded={createOpen}
              onClick={() => setCreateOpen((value) => !value)}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> {t("reminders.createTitle")}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", createOpen && "rotate-180")} />
            </Button>
          </div>

          {createOpen && (
            <Card>
              <CardHeader><CardTitle>{t("reminders.createTitle")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reminder-search">{t("reminders.patient")}</Label>
                  <Input
                    id="reminder-search"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder={t("reminders.searchPatient")}
                  />
                  <Select
                    value={patientId || "none"}
                    onValueChange={(value) => setPatientId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger><SelectValue placeholder={t("reminders.selectPatient")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("reminders.selectPatient")}</SelectItem>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}{patient.phone ? ` — ${patient.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-due">{t("reminders.dueOn")}</Label>
                  <Input
                    id="reminder-due"
                    type="date"
                    value={dueOn}
                    onChange={(event) => setDueOn(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-note">{t("reminders.note")}</Label>
                  <Textarea
                    id="reminder-note"
                    value={note}
                    maxLength={300}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <LoadingButton className="md:col-span-2" loading={processing} onClick={() => void create()}>
                  {t("reminders.create")}
                </LoadingButton>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-3">
              <section className="space-y-3">
                <h2 className="flex items-center justify-between gap-2 font-semibold text-red-800 dark:text-red-200">
                  <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {t("reminders.overdue")}</span>
                  <Badge variant="destructive">{data.overdue.length}</Badge>
                </h2>
                {data.overdue.length ? data.overdue.map(renderReminder) : <p className="text-sm text-muted-foreground">{t("reminders.none")}</p>}
              </section>
              <section className="space-y-3">
                <h2 className="flex items-center justify-between gap-2 font-semibold text-blue-800 dark:text-blue-200">
                  <span className="flex items-center gap-2"><BellRing className="h-4 w-4" /> {t("reminders.dueToday")}</span>
                  <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-100">{data.due.length}</Badge>
                </h2>
                {data.due.length ? data.due.map(renderReminder) : <p className="text-sm text-muted-foreground">{t("reminders.none")}</p>}
              </section>
              <section className="space-y-3">
                <h2 className="flex items-center justify-between gap-2 font-semibold">
                  <span className="flex items-center gap-2"><CalendarPlus className="h-4 w-4" /> {t("reminders.upcoming")}</span>
                  <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{data.upcoming.length}</Badge>
                </h2>
                {data.upcoming.length ? data.upcoming.slice(0, 25).map(renderReminder) : <p className="text-sm text-muted-foreground">{t("reminders.none")}</p>}
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="laser">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/25">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                    {t("reminders.laserTodayTitle")}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("reminders.laserTodayHint")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-violet-200 bg-violet-100 px-3 py-1 text-violet-900 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-100"
                >
                  {t("reminders.nextReminderDate", {
                    date: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
                      parseISO(`${reminderDueOn}T12:00:00`)
                    ),
                  })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-5">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>
              ) : laserPatients.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-12 text-center">
                  <UsersRound className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 font-medium">{t("reminders.noLaserPatients")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("reminders.noLaserPatientsHint")}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("reminders.selectedCount", {
                        selected: selectedLaserPatientIds.length,
                        total: laserPatients.length,
                      })}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLaserPatientIds(laserPatients.map((patient) => patient.patientId))}
                      >
                        {t("reminders.selectAll")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLaserPatientIds([])}
                      >
                        {t("reminders.clearSelection")}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {laserPatients.map((patient) => {
                      const selected = selectedLaserPatientIds.includes(patient.patientId)
                      const confirmed = confirmedLaserPatientIds.includes(patient.patientId)
                      const statusKey = `linkedReservations.status${patient.status.charAt(0).toUpperCase()}${patient.status.slice(1)}`
                      return (
                        <label
                          key={patient.patientId}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition sm:p-4",
                            selected
                              ? "border-violet-400 bg-violet-50 ring-2 ring-violet-500/10 dark:border-violet-700 dark:bg-violet-950/30"
                              : "bg-background hover:bg-muted/40"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-5 w-5 shrink-0 accent-violet-700"
                            checked={selected}
                            disabled={processing}
                            onChange={() => toggleLaserPatient(patient.patientId)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-start justify-between gap-2">
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{patient.patientName}</span>
                                <span className="block text-sm text-muted-foreground">
                                  {patient.patientPhone ?? t("reminders.noPhone")}
                                </span>
                              </span>
                              {confirmed && (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/70 dark:text-green-100"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> {t("reminders.reminderSaved")}
                                </Badge>
                              )}
                            </span>
                            <span className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={reservationStatusBadgeClass[patient.status]}
                              >
                                {t(statusKey)}
                              </Badge>
                              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" }).format(new Date(patient.startsAt))}
                                {" – "}
                                {new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" }).format(new Date(patient.endsAt))}
                              </span>
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {laserSelectionChanged
                        ? t("reminders.unsavedSelection")
                        : t("reminders.selectionUpToDate")}
                    </p>
                    <LoadingButton
                      className="w-full sm:w-auto"
                      loading={processing}
                      disabled={!laserSelectionChanged}
                      onClick={() => void saveLaserReminders()}
                    >
                      <CheckCircle2 className="me-2 h-4 w-4" />
                      {t("reminders.confirmSelection")}
                    </LoadingButton>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
