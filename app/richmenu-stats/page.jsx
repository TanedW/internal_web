"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  LayoutTemplate,
  Bot,
  Activity,
  ShieldCheck,
  RefreshCw,
  Trophy,
  AlertCircle,
  WifiOff,
  Menu,
  Lock,
  ImageOff,
} from "lucide-react";
import Sidebar from "../components/sidebar";

/* ─────────────────────────────────────────────
   Mock data — ใช้เมื่อ backend ไม่ตอบสนอง
───────────────────────────────────────────── */
const MOCK_DATA = [
  { botId: "bot_main_official",  richMenuId: "richmenu-promo-v4",       userCount: 125430 },
  { botId: "bot_main_official",  richMenuId: "richmenu-default",        userCount: 85200  },
  { botId: "bot_cs_support",     richMenuId: "richmenu-helpdesk",       userCount: 45120  },
  { botId: "bot_vip_member",     richMenuId: "richmenu-exclusive",      userCount: 12500  },
  { botId: "bot_hr_internal",    richMenuId: "richmenu-employee",       userCount: 3800   },
  { botId: "bot_event_q4",       richMenuId: "richmenu-event-register", userCount: 1200   },
];

const CHART_COLORS = [
  "#6366f1","#10b981","#f43f5e","#f59e0b","#0ea5e9","#8b5cf6","#64748b",
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const formatCount = (n) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000
      ? (n / 1_000).toFixed(1) + "k"
      : String(n);

const formatTime = (date) =>
  date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Metric summary card — matches the screenshot style */
function MetricCard({ label, value, unit, Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
      <div
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4"
        style={{ background: iconBg }}
      >
        <Icon size={20} color={iconColor} />
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-[2.25rem] font-black text-slate-900 leading-none tracking-tight">
          {value}
        </span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

/** Donut chart card — matches screenshot layout */
function DonutCard({ data, totalUsers }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
      <div className="mb-2">
        <h2 className="text-[15px] font-bold text-slate-800 m-0">สัดส่วนการใช้งาน</h2>
        <p className="text-[13px] text-slate-400 mt-0.5 m-0">แบ่งตามรูปแบบของ Rich Menu</p>
      </div>
      <div className="relative flex-1 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius="56%"
              outerRadius="76%"
              paddingAngle={2}
              dataKey="userCount"
              nameKey="richMenuId"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v.toLocaleString()} คน`, "ผู้ใช้งาน"]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={80}
              content={({ payload }) => (
                <ul className="flex flex-wrap justify-start gap-x-5 gap-y-2 mt-4 px-2 p-0 list-none">
                  {payload.map((entry, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span
                        className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: entry.color }}
                      />
                      <span className="max-w-[96px] truncate" title={entry.value}>
                        {entry.value}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "80px" }}>
          <span className="text-[11px] text-slate-400 font-medium">รวมทั้งหมด</span>
          <span className="text-2xl font-black text-slate-900 leading-snug">{formatCount(totalUsers)}</span>
        </div>
      </div>
    </div>
  );
}

/** Trophy rank icon */
function RankIcon({ rank }) {
  if (rank === 1) return <Trophy size={18} color="#f59e0b" className="mx-auto" />;
  if (rank === 2) return <Trophy size={18} color="#9ca3af" className="mx-auto" />;
  if (rank === 3) return <Trophy size={18} color="#b45309" className="mx-auto" />;
  return <span className="text-slate-400 text-[13px] font-medium">{rank}</span>;
}

/** Thumbnail placeholder */
function MenuThumbnail({ richMenuId }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-[52px] h-[52px] rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
      {failed ? (
        <ImageOff size={16} className="text-slate-300" />
      ) : (
        <img
          src={`http://localhost:8080/api/richmenu/image/${richMenuId}`}
          alt="menu preview"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/** Leaderboard table card — matches screenshot */
function LeaderboardCard({ data, lastUpdated }) {
  const maxUsers = Math.max(...data.map((d) => d.userCount), 1);

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 m-0">Top Rich Menus</h2>
          <p className="text-[13px] text-slate-400 mt-0.5 m-0">จัดอันดับริชเมนูที่มีผู้ใช้งานสูงสุด</p>
        </div>
        <span className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium whitespace-nowrap pt-0.5">
          <RefreshCw size={12} />
          อัปเดต: {formatTime(lastUpdated)}
        </span>
      </div>

      {/* table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13px] text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="w-16 py-3 px-5 text-[11px] font-semibold text-slate-400 tracking-wide text-center">
                อันดับ
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 tracking-wide">
                รายละเอียดริชเมนู
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-slate-400 tracking-wide text-right">
                ผู้ใช้งาน (คน)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const pct = (row.userCount / maxUsers) * 100;
              return (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                  {/* rank */}
                  <td className="py-4 px-5 text-center">
                    <RankIcon rank={i + 1} />
                  </td>

                  {/* rich menu info */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <MenuThumbnail richMenuId={row.richMenuId} />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 text-[13px]">
                          {row.richMenuId}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Lock size={10} className="flex-shrink-0" />
                          {row.botId}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* user count + bar */}
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                            opacity: i === 0 ? 1 : Math.max(0.3, pct / 100 + 0.1),
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 min-w-[68px] text-right tabular-nums">
                        {row.userCount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400 text-[13px]">
                  ไม่พบข้อมูลสถิติในขณะนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function DashboardPage() {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch('${process.env.NEXT_PUBLIC_RICHMENU_STATS_API_URL}');
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setStatsData((data || []).sort((a, b) => b.userCount - a.userCount));
      setIsOffline(false);
      setLastUpdated(new Date());
    } catch {
      console.warn("Backend unavailable — using mock data.");
      setStatsData(MOCK_DATA.sort((a, b) => b.userCount - a.userCount));
      setIsOffline(true);
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ระบบกำลังแสดงข้อมูลจำลอง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, []);

  const totalUsers = useMemo(() => statsData.reduce((s, d) => s + d.userCount, 0), [statsData]);
  const uniqueBots = useMemo(() => new Set(statsData.map((d) => d.botId)).size, [statsData]);
  const uniqueMenus = useMemo(() => new Set(statsData.map((d) => d.richMenuId)).size, [statsData]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900">
      <Sidebar
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      <main className={`transition-all duration-300 pt-16 lg:pt-0 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-28"}`}>
        {!isDesktopSidebarOpen && (
          <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30">
            <button
              onClick={() => setIsDesktopSidebarOpen(true)}
              className="p-2 bg-white rounded-xl shadow-md border border-slate-200"
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-[1.5rem] bg-indigo-50 text-indigo-600">
              <Activity size={32} className="animate-pulse" />
            </div>
            <p className="text-base font-bold text-slate-800">กำลังซิงค์ข้อมูลเรียลไทม์...</p>
            <p className="text-sm text-slate-400">กรุณารอสักครู่ ระบบกำลังจัดเตรียมแดชบอร์ด</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Rich Menu Analytics
                </h1>
                <p className="text-slate-400 text-sm mt-1">ติดตามสถิติการใช้งาน Rich Menu แบบเรียลไทม์</p>
              </div>
              <div className="flex items-center gap-3">
                {isOffline ? (
                  <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-medium text-rose-600">
                    <WifiOff size={12} /><span>โหมดออฟไลน์</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-medium text-emerald-600">
                    <ShieldCheck size={12} /><span>เชื่อมต่อแล้ว</span>
                  </div>
                )}
                <button
                  onClick={fetchData}
                  title="รีเฟรชข้อมูล"
                  className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-full transition-all duration-200 shadow-sm"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* ── Offline / error alert ── */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-amber-800 m-0">โหมดแสดงตัวอย่าง (Preview Mode)</p>
                  <p className="text-[13px] text-amber-600 mt-0.5 m-0">{error}</p>
                </div>
              </div>
            )}

            {/* ── Metric cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <MetricCard
                label="ผู้ใช้งานริชเมนูรวม"
                value={totalUsers.toLocaleString()}
                unit="บัญชี"
                Icon={Users}
                iconBg="#eef2ff"
                iconColor="#6366f1"
              />
              <MetricCard
                label="บอทที่เปิดใช้งาน"
                value={uniqueBots.toLocaleString()}
                unit="ระบบ"
                Icon={Bot}
                iconBg="#ecfdf5"
                iconColor="#10b981"
              />
              <MetricCard
                label="เทมเพลตริชเมนู"
                value={uniqueMenus.toLocaleString()}
                unit="รูปแบบ"
                Icon={LayoutTemplate}
                iconBg="#fffbeb"
                iconColor="#f59e0b"
              />
            </div>

            {/* ── Bottom grid: donut + leaderboard ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
              <DonutCard data={statsData} totalUsers={totalUsers} />
              <LeaderboardCard data={statsData} lastUpdated={lastUpdated} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
