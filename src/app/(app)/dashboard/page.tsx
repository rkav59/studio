"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, IconButton, MenuItem, Select, Skeleton,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography,
} from "@mui/material";
import {
  ArrowForwardRounded, AssignmentTurnedInOutlined, CalendarMonthRounded,
  ErrorOutlineRounded, EventAvailableRounded, HealthAndSafetyOutlined,
  RefreshRounded, WarningAmberRounded,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip,
  XAxis, YAxis,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/supabase/client";
import { collection, getDocs, query, where } from "@/lib/supabase/records";
import { visionColors as c } from "@/components/dashboard/vision-theme";
import { toIso } from "@/lib/supabase/serialization";
import type { Incident, SheqAudit, SheMeeting, SheProgram, TrainingRecord, KpiThreshold } from "@/lib/types";

type DashboardData = {
  incidents: Incident[];
  audits: SheqAudit[];
  meetings: SheMeeting[];
  programs: SheProgram[];
  training: TrainingRecord[];
  targets: KpiThreshold[];
  visibility: Record<string, boolean>;
};
type EventItem = { id: string; title: string; type: "Meeting" | "Programme"; date: number; href: string };
const cardSx = { height: "100%", borderRadius: "16px", bgcolor: c.paper, boxShadow: "0 7px 32px rgba(37,64,97,0.055)" };
const shortDate = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });
const monthName = new Intl.DateTimeFormat("en", { month: "short" });

function ms(value: unknown): number {
  try {
    const time = Date.parse(toIso(value));
    return Number.isFinite(time) ? time : NaN;
  } catch { return NaN; }
}
function inRange(date: unknown, start: number, end: number) {
  const n = ms(date); return Number.isFinite(n) && n >= start && n < end;
}
async function read<T>(name: string, uid: string): Promise<T[]> {
  const snap = await getDocs(query(collection(db, name), where("userId", "==", uid)));
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
}
async function loadDashboard(uid: string): Promise<DashboardData> {
  const [incidents, audits, meetings, programs, training, targets, visibilityDocs] = await Promise.all([
    read<Incident>("incidents", uid),
    read<SheqAudit>("sheqAudits", uid),
    read<SheMeeting>("sheMeetings", uid),
    read<SheProgram>("shePrograms", uid),
    read<TrainingRecord>("trainingRecords", uid),
    read<KpiThreshold>("kpiThresholds", uid),
    read<{ visibility?: Record<string, boolean> }>("kpiVisibilitySettings", uid),
  ]);
  return { incidents, audits, meetings, programs, training, targets, visibility: visibilityDocs[0]?.visibility ?? {} };
}
function changeLabel(now: number, before: number) {
  if (before === 0) return now === 0 ? "No change" : "New this period";
  const change = Math.round(((now - before) / before) * 100);
  return (change > 0 ? "+" : "") + change + "% vs prior period";
}
function SurfaceHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2.5 }}>
    <Box sx={{ minWidth: 0 }}><Typography variant="h6">{title}</Typography>{subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}</Box>
    {action}
  </Stack>;
}
function MetricCard({ label, value, detail, trend, icon: Icon, tint }: {
  label: string; value: string; detail: string; trend?: string; icon: SvgIconComponent; tint: string;
}) {
  return <Card sx={cardSx}><CardContent sx={{ p: 2.75, "&:last-child": { pb: 2.75 } }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 650, color: c.muted }}>{label}</Typography>
        <Typography sx={{ mt: 0.85, mb: 0.65, fontSize: { xs: 27, lg: 30 }, fontWeight: 800, letterSpacing: "-0.05em", color: c.heading }}>{value}</Typography>
      </Box>
      <Avatar variant="rounded" sx={{ bgcolor: tint, color: c.primary, borderRadius: 2.5, width: 45, height: 45 }}><Icon /></Avatar>
    </Stack>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", minHeight: 20 }}>{detail}</Typography>
    {trend && <Typography sx={{ mt: 1, fontSize: 11, color: "#64748B", fontWeight: 600 }}>{trend}</Typography>}
  </CardContent></Card>;
}
function ChartPanel({ incidents, months, now }: { incidents: Incident[]; months: number; now: number }) {
  const points = useMemo(() => {
    const today = new Date(now);
    const map = new Map<string, { key: string; month: string; incidents: number; nearMisses: number; hazards: number }>();
    for (let offset = months - 1; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      map.set(key, { key, month: monthName.format(date), incidents: 0, nearMisses: 0, hazards: 0 });
    }
    incidents.forEach(incident => {
      const date = new Date(incident.timestamp);
      if (Number.isNaN(date.getTime())) return;
      const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const row = map.get(key);
      if (!row) return;
      if (incident.type === "Incident") row.incidents++;
      else if (incident.type === "Near Miss") row.nearMisses++;
      else if (incident.type === "Hazard") row.hazards++;
    });
    return [...map.values()];
  }, [incidents, months, now]);
  const hasAny = points.some(row => row.incidents || row.nearMisses || row.hazards);
  return <Card sx={cardSx}><CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: 3 } }}>
    <SurfaceHeading title="Incident & reporting trends" subtitle="Recorded incidents, near misses and hazards over time" />
    {hasAny ? <Box role="img" aria-label="Monthly trend chart of incidents, near misses and hazards" sx={{ width: "100%", height: { xs: 270, sm: 330 } }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="incidentArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0075FF" stopOpacity={0.22} /><stop offset="100%" stopColor="#0075FF" stopOpacity={0} /></linearGradient>
            <linearGradient id="nearArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22B8A8" stopOpacity={0.12} /><stop offset="100%" stopColor="#22B8A8" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#EEF1F6" strokeDasharray="4 4" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#91A0B3", fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#91A0B3", fontSize: 11 }} />
          <ChartTooltip contentStyle={{ border: "1px solid #EEF1F5", borderRadius: 12, boxShadow: "0 8px 20px #00000010" }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#0075FF" strokeWidth={2.6} fill="url(#incidentArea)" />
          <Area type="monotone" dataKey="nearMisses" name="Near misses" stroke="#22B8A8" strokeWidth={2.4} fill="url(#nearArea)" />
          <Area type="monotone" dataKey="hazards" name="Hazards" stroke="#F5AB45" strokeWidth={2.2} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </Box> : <Stack alignItems="center" justifyContent="center" sx={{ height: 310, color: c.subtle }}>
      <HealthAndSafetyOutlined sx={{ fontSize: 36, mb: 1 }} /><Typography fontWeight={650} color="text.primary">No reports for this period</Typography>
      <Typography variant="body2">Incident trends will appear after reports are recorded.</Typography>
    </Stack>}
  </CardContent></Card>;
}
function EventsPanel({ events }: { events: EventItem[] }) {
  return <Card sx={cardSx}><CardContent sx={{ p: 2.75, "&:last-child": { pb: 2.75 } }}>
    <SurfaceHeading title="Upcoming SHE events" subtitle="Meetings and programmes" action={
      <Tooltip title="View SHE meetings and programmes"><IconButton component={Link} href="/she-meetings" aria-label="View all SHE events" size="small"><ArrowForwardRounded fontSize="small" /></IconButton></Tooltip>
    } />
    {events.length ? <Stack spacing={1.8}>
      {events.slice(0, 4).map(event => <Stack key={event.id} direction="row" spacing={1.5} alignItems="center">
        <Avatar variant="rounded" sx={{ borderRadius: 2.5, width: 42, height: 42, bgcolor: event.type === "Meeting" ? "#EAF3FF" : "#E9FBF6", color: event.type === "Meeting" ? "#0075FF" : "#1DAF75" }}>
          {event.type === "Meeting" ? <CalendarMonthRounded fontSize="small" /> : <EventAvailableRounded fontSize="small" />}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontSize={13} fontWeight={700} noWrap>{event.title}</Typography>
          <Typography fontSize={11.5} color="text.secondary">{shortDate.format(event.date)} · {event.type}</Typography>
        </Box>
        <IconButton component={Link} href={event.href} aria-label={"Open " + event.title} size="small"><ArrowForwardRounded sx={{ fontSize: 16 }} /></IconButton>
      </Stack>)}
    </Stack> : <Stack alignItems="center" justifyContent="center" sx={{ py: 3, textAlign: "center" }}>
      <CalendarMonthRounded sx={{ color: "#A0AEC0", mb: 1 }} />
      <Typography fontSize={13} fontWeight={650}>Nothing scheduled yet</Typography>
      <Typography fontSize={12} color="text.secondary" sx={{ mb: 1.5 }}>Schedule meetings and programmes to see them here.</Typography>
      <Button component={Link} href="/she-meetings" size="small">Schedule an event</Button>
    </Stack>}
  </CardContent></Card>;
}
function ProgressPanel({ audits }: { audits: SheqAudit[] }) {
  const completed = audits.filter(a => a.status === "Completed" || a.status === "Closed").length;
  const percent = audits.length ? Math.round(completed / audits.length * 100) : null;
  return <Card sx={cardSx}><CardContent sx={{ p: 2.75, "&:last-child": { pb: 2.75 } }}>
    <SurfaceHeading title="Audit progress" subtitle="Completion across recorded audits" />
    <Stack direction={{ xs: "row", lg: "row" }} spacing={2.5} alignItems="center">
      <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
        <CircularProgress variant="determinate" value={100} size={102} thickness={5} sx={{ color: "#EAF1FA" }} />
        <CircularProgress variant="determinate" value={percent ?? 0} size={102} thickness={5} sx={{ color: c.primary, position: "absolute", left: 0, "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }} />
        <Box sx={{ inset: 0, position: "absolute", display: "grid", placeItems: "center" }}>
          <Typography fontSize={24} fontWeight={800}>{percent === null ? "—" : percent + "%"}</Typography>
        </Box>
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={700} fontSize={14}>{audits.length ? completed + " of " + audits.length + " complete" : "No audits recorded"}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.75 }}>Track completion through your SHEQ audit workspace.</Typography>
        <Button size="small" component={Link} href="/sheq-audit" endIcon={<ArrowForwardRounded />} sx={{ mt: 1.5, px: 0 }}>Open audits</Button>
      </Box>
    </Stack>
  </CardContent></Card>;
}
function StatusChip({ status }: { status: "On target" | "Below target" | "Above target" | "No target" | "Not available" }) {
  const color = status === "On target" ? "success" : status === "No target" || status === "Not available" ? "default" : "warning";
  return <Chip label={status} color={color} size="small" sx={{ bgcolor: color === "default" ? "#F0F3F8" : undefined, fontSize: 11 }} />;
}
function PerformanceTable({ rows }: { rows: { name: string; value: string; target: number | null; unit: string; status: "On target" | "Below target" | "Above target" | "No target" | "Not available" }[] }) {
  return <Card sx={cardSx}><CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: 2 } }}>
    <SurfaceHeading title="SHEQ performance overview" subtitle="Operational KPIs based on your recorded data and configured targets"
      action={<Button component={Link} href="/dashboard/kpi-settings" size="small" endIcon={<ArrowForwardRounded />} sx={{ whiteSpace: "nowrap" }}>KPI targets</Button>} />
    <TableContainer role="region" tabIndex={0} aria-label="Scrollable SHEQ KPI performance table" sx={{ maxWidth: "100%", overflowX: "auto", "&:focus-visible": { outline: "2px solid #0075FF", outlineOffset: 2 } }}>
      <Table size="small" sx={{ minWidth: 560 }} aria-label="SHEQ KPI performance table">
        <TableHead><TableRow sx={{ bgcolor: "#FAFBFD" }}>{["INDICATOR", "CURRENT VALUE", "TARGET", "STATUS"].map(h => <TableCell key={h} sx={{ fontSize: 10, letterSpacing: 0.6, fontWeight: 800, color: "#9AA6B8", py: 1.6 }}>{h}</TableCell>)}</TableRow></TableHead>
        <TableBody>{rows.map(row => <TableRow key={row.name} hover>
          <TableCell sx={{ fontSize: 13, fontWeight: 700, py: 2 }}>{row.name}</TableCell>
          <TableCell sx={{ fontSize: 13, fontWeight: 750 }}>{row.value}</TableCell>
          <TableCell sx={{ fontSize: 12.5, color: c.muted }}>{row.target === null ? "Not set" : row.target + row.unit}</TableCell>
          <TableCell><StatusChip status={row.status} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer>
    <Typography sx={{ fontSize: 11.5, mt: 2, color: c.muted }}>Injury severity rate requires verified hours worked. It is intentionally not estimated from incident counts alone.</Typography>
  </CardContent></Card>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [months, setMonths] = useState(6);
  const [now, setNow] = useState(() => Date.now());
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["vision-dashboard", user?.uid],
    queryFn: () => loadDashboard(user!.uid),
    enabled: Boolean(user?.uid),
    staleTime: 60_000,
  });
  const model = useMemo(() => {
    if (!data) return null;
    const date = new Date(now);
    const currentStart = new Date(date.getFullYear(), date.getMonth() - months + 1, 1).getTime();
    const previousStart = new Date(date.getFullYear(), date.getMonth() - months * 2 + 1, 1).getTime();
    const inc = data.incidents.filter(i => inRange(i.timestamp, currentStart, now + 1));
    const prevInc = data.incidents.filter(i => inRange(i.timestamp, previousStart, currentStart));
    const isRecorded = (i: Incident) => i.type === "Incident" && (i.isRecordable === true || i.classification === "Recordable" || i.classification === "Lost Time");
    const recordables = inc.filter(isRecorded).length, previousRecordables = prevInc.filter(isRecorded).length;
    const nearMisses = inc.filter(i => i.type === "Near Miss").length, previousNearMisses = prevInc.filter(i => i.type === "Near Miss").length;
    const lostDays = inc.filter(i => i.type === "Incident").reduce((sum, i) => sum + Math.max(0, Number(i.lostWorkDays) || 0), 0);
    const prevLostDays = prevInc.filter(i => i.type === "Incident").reduce((sum, i) => sum + Math.max(0, Number(i.lostWorkDays) || 0), 0);
    const audits = data.audits.filter(a => inRange(a.auditDate, currentStart, now + 1));
    const closedAudits = audits.filter(a => a.status === "Closed" || a.status === "Completed").length;
    const auditPct = audits.length ? Math.round(closedAudits / audits.length * 100) : null;
    const tracked = inc.filter(i => i.type !== "Hazard");
    const closed = tracked.filter(i => i.status === "Closed").length;
    const closurePct = tracked.length ? Math.round(closed / tracked.length * 100) : null;
    const training = data.training.filter(t => inRange(t.trainingDate, currentStart, now + 1));
    const trainingPct = training.length ? Math.round(training.filter(t => t.status === "Completed").length / training.length * 100) : null;
    const target = (key: string) => data.targets.find(t => t.kpiKey === key);
    const threshold = (key: string) => target(key)?.value ?? null;
    const direction = (key: string): "above" | "below" => target(key)?.targetDirection === "below" ? "below" : "above";
    const result = (value: number | null, target: number | null, direction: "above" | "below") => {
      if (value === null) return "Not available" as const;
      if (target === null) return "No target" as const;
      if ((direction === "above" && value >= target) || (direction === "below" && value <= target)) return "On target" as const;
      return direction === "above" ? "Below target" as const : "Above target" as const;
    };
    const rows = [
      { name: "Incident closure rate", value: closurePct === null ? "—" : closurePct + "%", target: threshold("IncidentClosureRate"), unit: "%", status: result(closurePct, threshold("IncidentClosureRate"), direction("IncidentClosureRate")) },
      { name: "Injury severity rate (per 200,000 hrs)", value: "—", target: threshold("SeverityRate"), unit: "", status: "Not available" as const },
      { name: "Near-miss reports", value: String(nearMisses), target: null, unit: "", status: "No target" as const },
      { name: "Audit completion", value: auditPct === null ? "—" : auditPct + "%", target: null, unit: "%", status: auditPct === null ? "Not available" as const : "No target" as const },
      { name: "Training completion", value: trainingPct === null ? "—" : trainingPct + "%", target: null, unit: "%", status: trainingPct === null ? "Not available" as const : "No target" as const },
    ];
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const events: EventItem[] = [
      ...data.meetings.filter(m => ms(m.meetingDate) >= todayStart).map(m => ({ id: "meeting-" + m.id, title: m.title, type: "Meeting" as const, date: ms(m.meetingDate), href: "/she-meetings" })),
      ...data.programs.filter(p => p.status !== "Cancelled" && p.status !== "Completed" && (ms(p.startDate) >= todayStart || (p.status === "Ongoing" && (!p.endDate || ms(p.endDate) >= todayStart))))
        .map(p => ({ id: "program-" + p.id, title: p.programName, type: "Programme" as const, date: Math.max(todayStart, ms(p.startDate)), href: "/she-meetings" })),
    ].filter(e => Number.isFinite(e.date)).sort((a, b) => a.date - b.date);
    return { inc, recordables, previousRecordables, nearMisses, previousNearMisses, lostDays, prevLostDays, auditPct, audits, events, rows: rows.filter(row => data.visibility[row.name.replaceAll(" ", "")] !== false) };
  }, [data, months, now]);

  return <Box sx={{ maxWidth: 1700, mx: "auto" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4">Safety at a glance</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>Safety performance and upcoming activities from records available to your account.</Typography></Box>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Select size="small" value={months} onChange={event => setMonths(Number(event.target.value))} aria-label="Dashboard reporting period"
          sx={{ bgcolor: "#fff", borderRadius: 2.5, minWidth: 138, fontSize: 13, "& fieldset": { borderColor: "#EEF1F5" } }}>
          <MenuItem value={6}>Last 6 months</MenuItem><MenuItem value={12}>Last 12 months</MenuItem>
        </Select>
        <Tooltip title="Refresh dashboard"><span><IconButton aria-label="Refresh dashboard" disabled={isFetching} onClick={() => { setNow(Date.now()); refetch(); }}
          sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #EEF1F5", width: 40, height: 40 }}><RefreshRounded fontSize="small" /></IconButton></span></Tooltip>
      </Stack>
    </Stack>

    {error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>Unable to load dashboard data. Please check your connection and try again.</Alert>}
    {error && !data ? <Card sx={cardSx}><CardContent><Typography fontWeight={650}>Dashboard data is unavailable</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No figures are shown until the records can be loaded securely.</Typography><Button onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button></CardContent></Card> : isLoading || !model || !data ? <Stack spacing={2.5}>
      <Grid container spacing={2.5}>{[0,1,2,3].map(n => <Grid item xs={12} sm={6} lg={3} key={n}><Skeleton variant="rounded" height={168} sx={{ borderRadius: 4 }} /></Grid>)}</Grid>
      <Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} />
      <Skeleton variant="rounded" height={260} sx={{ borderRadius: 4 }} />
    </Stack> : <>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} lg={3}><MetricCard label="Recordable incidents" value={String(model.recordables)} detail="In selected reporting period" trend={changeLabel(model.recordables, model.previousRecordables)} icon={ErrorOutlineRounded} tint="#EAF3FF" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard label="Lost workdays" value={String(model.lostDays)} detail="Reported injury-related days lost" trend={changeLabel(model.lostDays, model.prevLostDays)} icon={HealthAndSafetyOutlined} tint="#E9F7F2" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard label="Near-miss reports" value={String(model.nearMisses)} detail="Proactive safety reports" trend={changeLabel(model.nearMisses, model.previousNearMisses)} icon={WarningAmberRounded} tint="#FFF4E5" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><MetricCard label="Audits completed" value={model.auditPct === null ? "—" : model.auditPct + "%"} detail={model.audits.length ? "Of " + model.audits.length + " audits this period" : "No audits in this period"} icon={AssignmentTurnedInOutlined} tint="#F0EDFF" /></Grid>
      </Grid>
      <Grid container spacing={2.5} alignItems="stretch" sx={{ mb: 2.5 }}>
        <Grid item xs={12} lg={8}><ChartPanel incidents={data.incidents} months={months} now={now} /></Grid>
        <Grid item xs={12} lg={4}><Stack spacing={2.5} sx={{ height: "100%" }}><EventsPanel events={model.events} /><ProgressPanel audits={model.audits} /></Stack></Grid>
      </Grid>
      <PerformanceTable rows={model.rows} />
    </>}
  </Box>;
}
