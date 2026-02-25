"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { Loader2, CheckCircle2, Menu } from "lucide-react";
import "./style.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function SearchOrgPage() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) window.location.href = "/";
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://internal-web-api-y4if.vercel.app/src/proxy-search-org/search-org?search=${encodeURIComponent(searchTerm)}&limit=20&threshold=0.1`,
      );

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Backend returned non-JSON:", text.slice(0, 300));
        throw new Error("Backend ตอบกลับผิดพลาด — route อาจไม่ถูกต้อง");
      }
      if (!res.ok) throw new Error(data.message || "ไม่สามารถเชื่อมต่อได้");

      const sortedData = (data.data || []).sort(
        (a, b) =>
          parseFloat(b.similarity_score) - parseFloat(a.similarity_score),
      );

      setResults(sortedData);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreStyle = (scoreStr) => {
    const score = parseFloat(scoreStr);
    if (score > 0.6) return { class: "high-match", text: "ซ้ำสูง" };
    if (score > 0.4) return { class: "mid-match", text: "คล้ายกัน" };
    return { class: "low-match", text: "คล้ายน้อย" };
  };

  return (
    <div className="so-root">
      <Sidebar
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      {/* Sidebar toggle — desktop only */}
      {!isDesktopSidebarOpen && (
        <div className="so-sidebar-toggle">
          <button
            onClick={() => setIsDesktopSidebarOpen(true)}
            className="so-toggle-btn"
          >
            <Menu size={22} />
          </button>
        </div>
      )}

      <main className={`so-main ${isDesktopSidebarOpen ? "so-main--shifted" : ""}`}>
        <div className="so-wrapper">

          {/* Header */}
          <header className="so-header">
            <h1 className="so-title">ระบบตรวจสอบหน่วยงาน</h1>
            <p className="so-subtitle">ค้นหาและเปรียบเทียบชื่อที่คล้ายคลึงกันในฐานข้อมูล</p>
          </header>

          {/* Search Card */}
          <div className="so-search-card">
            <form onSubmit={handleSearch} className="so-form">
              <input
                type="text"
                className="so-input"
                placeholder="พิมพ์ชื่อหน่วยงานที่ต้องการตรวจสอบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="so-btn-search"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "ตรวจสอบชื่อ"
                )}
              </button>
            </form>
          </div>

          {/* Results Area */}
          <div className="so-results">

            {/* Error */}
            {error && (
              <div className="so-error">ขออภัย: {error}</div>
            )}

            {/* Legend */}
            {pagination && (
              <div className="so-legend-wrap">
                <p className="so-result-count">
                  พบ <strong>{pagination.total_records}</strong> รายการที่คล้ายคลึง
                </p>
                <div className="so-legend">
                  <span className="so-legend-label">คำอธิบาย:</span>
                  <span><span className="text-warning-label">สีส้ม</span> ตัวอักษรคล้าย</span>
                  <span><span className="text-danger-label">สีแดง</span> ตัวอักษรที่พิมพ์ผิด</span>
                  <span><del>ข้อความ</del> หน่วยงานที่ถูกลบ</span>
                </div>
              </div>
            )}

            {/* Result List */}
            <ul className="so-list">
              {results.map((item) => {
                const scoreInfo = getScoreStyle(item.similarity_score);
                const isDeleted = !!item.deleted_at;

                return (
                  <li
                    key={item.id}
                    className={`so-item ${isDeleted ? "is-deleted" : ""}`}
                  >
                    <div className="so-item-info">
                      <div className="so-item-name-row">
                        <span
                          className="org-name"
                          dangerouslySetInnerHTML={{
                            __html: item.highlighted_name || item.name,
                          }}
                        />
                        {item.tag_type && (
                          <span className="badge badge-official">
                            <CheckCircle2 size={12} /> บัญชีทางการ
                          </span>
                        )}
                        {isDeleted && (
                          <span className="badge badge-deleted">
                            🗑 ลบเมื่อ{" "}
                            {new Date(item.deleted_at).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <span className="so-item-id">ID: {item.id}</span>
                    </div>

                    <div className="so-item-score">
                      <span className="so-score-label">คะแนนความคล้าย</span>
                      <span className={`score-badge ${scoreInfo.class}`}>
                        {(parseFloat(item.similarity_score) * 100).toFixed(0)}%{" "}
                        {scoreInfo.text}
                      </span>
                    </div>
                  </li>
                );
              })}

              {!isLoading && results.length === 0 && !error && (
                <div className="so-empty">
                  {searchTerm
                    ? "ไม่พบข้อมูลที่ซ้ำกัน คุณสามารถใช้ชื่อนี้ได้"
                    : "กรุณากรอกชื่อหน่วยงานเพื่อเริ่มการค้นหา"}
                </div>
              )}
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
