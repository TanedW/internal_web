"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { Search, Info, Loader2, CheckCircle2 } from "lucide-react";
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

      // เรียงลำดับตามคะแนนความคล้ายคลึงจากมากไปน้อย (Descending)
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
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      <main
        className={`flex-1 transition-all duration-300 pt-20 px-4 md:px-6 lg:p-8 ${isDesktopSidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}
      >
        <div className="container-custom">
          <header className="header-section text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-blue-600 mb-2">
              ระบบตรวจสอบหน่วยงาน
            </h1>
            <p className="text-slate-500">
              ค้นหาและเปรียบเทียบชื่อที่คล้ายคลึงกันในฐานข้อมูล
            </p>
          </header>

          <div className="search-card bg-white p-6 md:p-8 rounded-2xl shadow-sm mb-8">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                className="flex-1 p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                placeholder="พิมพ์ชื่อหน่วยงานที่ต้องการตรวจสอบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-4 sm:py-0 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:bg-slate-300 flex justify-center items-center"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "ตรวจสอบชื่อ"
                )}
              </button>
            </form>
          </div>

          <div id="resultsArea">
            {error && (
              <div className="text-red-500 text-center p-4 bg-red-50 rounded-xl mb-4">
                ขออภัย: {error}
              </div>
            )}

            {pagination && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-700">
                    พบ {pagination.total_records} รายการที่คล้ายคลึง
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 flex-wrap bg-slate-100 p-3 rounded-lg">
                  <span>คำอธิบาย:</span>
                  <span>
                    <span className="text-warning-label">สีส้ม</span>{" "}
                    ตัวอักษรคล้าย
                  </span>
                  <span>
                    <span className="text-danger-label">สีแดง</span>{" "}
                    ตัวอักษรที่พิมพ์ผิด
                  </span>
                  <span>
                    <del>ข้อความ</del> หน่วยงานที่ถูกลบ
                  </span>
                </div>
              </div>
            )}

            <ul className="grid gap-4 list-none p-0">
              {results.map((item) => {
                const scoreInfo = getScoreStyle(item.similarity_score);
                const isDeleted = !!item.deleted_at;

                return (
                  <li
                    key={item.id}
                    className={`result-item bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:shadow-md ${isDeleted ? "is-deleted" : ""}`}
                  >
                    <div className="org-info flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="org-name text-lg font-medium"
                          dangerouslySetInnerHTML={{
                            __html: item.highlighted_name || item.name,
                          }}
                        />
                        {item.tag_type && (
                          <span className="badge badge-official">
                            <CheckCircle2 size={14} className="text-blue-500" />{" "}
                            บัญชีทางการ
                          </span>
                        )}
                        {isDeleted && (
                          <span className="badge badge-deleted">
                            🗑 ลบเมื่อ{" "}
                            {new Date(item.deleted_at).toLocaleDateString(
                              "th-TH",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        ID: {item.id}
                      </span>
                    </div>
                    <div className="score-container text-left sm:text-right w-full sm:w-auto sm:min-w-[130px] mt-3 sm:mt-0">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                        คะแนนความคล้าย
                      </span>
                      <span
                        className={`score-badge px-3 py-1 rounded-full text-sm font-bold ${scoreInfo.class}`}
                      >
                        {(parseFloat(item.similarity_score) * 100).toFixed(0)}%{" "}
                        {scoreInfo.text}
                      </span>
                    </div>
                  </li>
                );
              })}

              {!isLoading && results.length === 0 && !error && (
                <div className="text-center p-10 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
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
