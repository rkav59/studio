"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AppBar, Autocomplete, Avatar, Box, Breadcrumbs, Dialog, DialogContent, DialogTitle, Divider, Drawer, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, TextField, Toolbar, Tooltip,
  Typography, InputAdornment,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined, AutoAwesomeOutlined,
  CalendarMonthOutlined, ChecklistRtlOutlined, DashboardRounded, FactCheckOutlined,
  FavoriteBorderRounded, GroupsOutlined, HealthAndSafetyOutlined, LibraryBooksOutlined,
  LogoutRounded, MenuRounded, NotificationsNoneRounded, SearchRounded,
  ShieldOutlined, WorkspacePremiumOutlined, CloseRounded,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import type { UserProfile } from "@/lib/types";
import { SheiqproLogo } from "@/components/icons/sheiqpro-logo";
import { GenerateReportButton } from "@/components/layout/generate-report-button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { VisionThemeProvider, visionColors } from "@/components/dashboard/vision-theme";
import { BILLING_ENABLED } from "@/lib/billing/feature-flags";

const width = 264;
type NavItem = { href: string; label: string; icon: SvgIconComponent; adminOnly?: boolean };
const groups: { label: string; items: NavItem[] }[] = [
  { label: "OVERVIEW", items: [
    { href: "/dashboard", label: "Dashboard", icon: DashboardRounded },
    { href: "/risk-management", label: "Risk Management", icon: ShieldOutlined },
    { href: "/she-meetings", label: "SHE Meetings & Programs", icon: CalendarMonthOutlined },
    { href: "/sheq-audit", label: "SHEQ Audits", icon: FactCheckOutlined },
  ] },
  { label: "OPERATIONS", items: [
    { href: "/training-competence", label: "Training & Competence", icon: LibraryBooksOutlined },
    { href: "/emergency-preparedness", label: "Emergency Preparedness", icon: HealthAndSafetyOutlined },
    { href: "/ppe-management", label: "PPE Management", icon: WorkspacePremiumOutlined },
    { href: "/contractor-safety", label: "Contractor Safety", icon: ChecklistRtlOutlined },
    { href: "/health-monitoring", label: "Health Monitoring", icon: FavoriteBorderRounded },
  ] },
  { label: "MANAGE", items: [
    { href: "/checklist-templates", label: "Checklist Templates", icon: LibraryBooksOutlined },
    { href: "/ai-recommendations", label: "AI Safety Hub", icon: AutoAwesomeOutlined },
    { href: "/user-management", label: "User Management", icon: GroupsOutlined, adminOnly: true },
    ...(BILLING_ENABLED ? [{ href: "/billing", label: "Subscription", icon: AdminPanelSettingsOutlined, adminOnly: true }] : []),
  ] },
];

function SideNav({ currentPath, userProfile, close, signOut }: {
  currentPath: string; userProfile: UserProfile | null; close: () => void; signOut: () => void;
}) {
  return <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", bgcolor: "#FFFFFF", px: 1.5, pt: 2, pb: 1.5 }}>
    <Box component={Link} href="/dashboard" onClick={close} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 2, flexShrink: 0, textDecoration: "none", color: "text.primary", "@media (max-height: 720px)": { mb: 1 } }}>
      <SheiqproLogo className="h-9 w-9 text-[#0075FF]" />
      <Box><Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1, letterSpacing: "-0.035em" }}>SHEiQpro</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>Safety intelligence</Typography></Box>
    </Box>
    <Box component="div" role="group" aria-label="Application pages" tabIndex={0} sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", scrollbarWidth: "none", msOverflowStyle: "none", "&::-webkit-scrollbar": { display: "none" }, "&:focus-visible": { outline: "2px solid #0075FF", outlineOffset: -2, borderRadius: 2 } }}>
      {groups.map(group => {
        const items = group.items.filter(i => !i.adminOnly || userProfile?.role === "admin");
        if (!items.length) return null;
        return <Box key={group.label} sx={{ mb: 1.5, "@media (max-height: 720px)": { mb: 0.5 } }}>
          <Typography sx={{ px: 1.5, mb: 0.5, color: "#9AA6B8", fontSize: 10, fontWeight: 800, letterSpacing: 1.1, "@media (max-height: 660px)": { mb: 0.15, fontSize: 9 } }}>{group.label}</Typography>
          <List disablePadding sx={{ display: "grid", gap: 0.15 }}>
            {items.map(item => {
              const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
              const Icon = item.icon;
              return <ListItemButton key={item.href} component={Link} href={item.href} onClick={close} selected={active}
                sx={{ borderRadius: 2.5, px: 1.25, py: 0.35, minHeight: 37, color: active ? visionColors.primary : "#64748B", "@media (max-height: 720px)": { minHeight: 31, py: 0.1 },
                  "&.Mui-selected": { bgcolor: "#EAF3FF", color: visionColors.primary },
                  "&.Mui-selected:hover": { bgcolor: "#DDEEFF" }, "&:hover": { bgcolor: "#F3F7FC" } }}>
                <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}><Icon sx={{ fontSize: 19 }} /></ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 12.75, fontWeight: active ? 750 : 550, noWrap: true }} />
              </ListItemButton>;
            })}
          </List>
        </Box>;
      })}
    </Box>
    <Box sx={{ flexShrink: 0, mt: "auto", pt: 1, bgcolor: "#FFFFFF" }}>
      <Divider sx={{ mb: 1 }} />
      <ListItemButton onClick={signOut} sx={{ borderRadius: 2.5, minHeight: 40, px: 1.25, color: "#64748B" }}>
        <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}><LogoutRounded sx={{ fontSize: 19 }} /></ListItemIcon>
        <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: 12.75, fontWeight: 650 }} />
      </ListItemButton>
    </Box>
  </Box>;
}

function Shell({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null }) {
  const { user, signOutUser } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const nav = groups.flatMap(g => g.items).filter(i => !i.adminOnly || userProfile?.role === "admin");
  const current = nav.find(n => pathname === n.href || pathname.startsWith(n.href + "/"));
  const title = current?.label ?? "Workspace";
  async function logout() {
    try { await signOutUser(); router.replace("/sign-in"); }
    catch (error) { toast({ title: "Unable to sign out", description: (error as Error).message, variant: "destructive" }); }
  }
  const contents = (close: () => void) => <SideNav currentPath={pathname} userProfile={userProfile} close={close} signOut={logout} />;

  return <Box sx={{ display: "flex", minHeight: "100svh", bgcolor: visionColors.background, color: "text.primary" }}>
    <Box component="nav" aria-label="Primary navigation" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width, border: 0 } }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", pr: 1, pt: 1 }}>
          <IconButton aria-label="Close navigation" onClick={() => setMobileOpen(false)}><CloseRounded /></IconButton>
        </Box>{contents(() => setMobileOpen(false))}
      </Drawer>
      <Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width, border: 0, boxShadow: "4px 0 24px rgba(33,57,93,0.025)" } }}>
        {contents(() => {})}
      </Drawer>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: "rgba(248,249,250,0.94)", backdropFilter: "blur(12px)", zIndex: theme => theme.zIndex.appBar, borderBottom: "1px solid #EEF1F5" }}>
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1.5 }, minHeight: { xs: 68, sm: 76 }, px: { xs: 2, md: 3, lg: 4 } }}>
          <IconButton edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }}><MenuRounded /></IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Breadcrumbs separator="/" sx={{ "& .MuiTypography-root": { fontSize: 11, color: "#9AA6B8" } }}>
              <Typography>Workspace</Typography><Typography>{title}</Typography>
            </Breadcrumbs>
            <Typography fontWeight={750} fontSize={{ xs: 14, sm: 17 }} noWrap>{title}</Typography>
          </Box>
          <Autocomplete
            freeSolo={false}
            disableClearable
            options={nav}
            getOptionLabel={option => option.label}
            onChange={(_, option) => { if (option) router.push(option.href); }}
            sx={{ display: { xs: "none", sm: "block" }, width: { sm: 195, lg: 260 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2.5 } }}
            renderInput={params => <TextField {...params} placeholder="Find a page" inputProps={{ ...params.inputProps, "aria-label": "Find a page" }}
              InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: "#A0AEC0", fontSize: 20 }} /></InputAdornment> }} />}
          />
          <IconButton aria-label="Search navigation" onClick={() => setSearchOpen(true)} sx={{ display: { sm: "none" } }}><SearchRounded /></IconButton>
          <Box sx={{ display: "block" }}><GenerateReportButton /></Box>
          <Tooltip title="SHE meetings and programmes"><IconButton aria-label="Open SHE events" component={Link} href="/she-meetings" sx={{ color: "#64748B" }}><NotificationsNoneRounded /></IconButton></Tooltip>
          <Tooltip title="Profile"><IconButton aria-label="Open profile" component={Link} href="/user-profile">
            <Avatar sx={{ bgcolor: "#E5F0FF", color: visionColors.primary, height: 36, width: 36, fontSize: 14, fontWeight: 800 }}>
              {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
            </Avatar>
          </IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Find a page</DialogTitle>
        <DialogContent>
          <Autocomplete options={nav} getOptionLabel={option => option.label} onChange={(_, option) => { if (option) { setSearchOpen(false); router.push(option.href); } }} renderInput={params => <TextField {...params} autoFocus placeholder="Search SHEiQpro pages" sx={{ mt: 1 }} />} />
        </DialogContent>
      </Dialog>
      <Box component="main" id="main-content" sx={{ flex: 1, minWidth: 0, px: { xs: 2, sm: 3, lg: 4 }, pt: { xs: 3, md: 4 }, pb: 6 }}>
        <Box className="workspace-content" sx={{ width: "100%", maxWidth: 1700, mx: "auto", minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  </Box>;
}

export default function AppLayoutInternal({ children, userProfile }: { children: ReactNode; userProfile: UserProfile | null }) {
  return <VisionThemeProvider><Shell userProfile={userProfile}>{children}</Shell></VisionThemeProvider>;
}
