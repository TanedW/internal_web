"use client";
import React, { useMemo } from "react";

const FlexRender = ({ json }) => {
  // สร้าง HTML String เพื่อยัดใส่ Iframe (ตัดขาดจากโลกภายนอก)
  const srcDoc = useMemo(() => {
    if (!json) return "";

    // 1. ปรับโครงสร้าง JSON ให้ถูกต้องตาม Flex Message Format
    let messageToRender = json;
    
    // ถ้าส่งมาแค่ Bubble หรือ Carousel ต้องห่อด้วย Flex Container ก่อน
    if (json.type === "bubble" || json.type === "carousel") {
      messageToRender = {
        type: "flex",
        altText: "Flex Message Preview",
        contents: json
      };
    }

    // แปลง JSON เป็น String เพื่อส่งเข้า Script
    const jsonString = JSON.stringify(messageToRender);

    // 2. HTML Template ที่มีระบบรอโหลด Script (Polling)
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flex Preview</title>
        <link href="https://cdn.jsdelivr.net/npm/flex2html@1.1.1/dist/flex2html.css" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #F0F2F5; /* สีพื้นหลังเหมือน LINE App */
            display: flex;
            justify-content: center;
            align-items: flex-start;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          /* Reset Box Sizing เพื่อความแม่นยำ */
          * { box-sizing: content-box; }
          
          /* ซ่อน Scrollbar */
          ::-webkit-scrollbar { width: 0px; background: transparent; }
          
          /* Loading Indicator */
          #loading {
            color: #888;
            font-size: 12px;
            margin-top: 20px;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <div id="loading">Loading Renderer...</div>

        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/flex2html@1.1.1/dist/flex2html.min.js"></script>

        <script>
          (function() {
            var maxRetries = 50; // รอได้นานสุด 5 วินาที
            var attempts = 0;

            function checkLibraryAndRender() {
              // เช็คว่าโหลดเสร็จหรือยัง?
              if (window.flex2html && window.jQuery) {
                document.getElementById('loading').style.display = 'none'; // ซ่อน Loading
                try {
                  var data = ${jsonString};
                  flex2html("root", data); // สั่ง Render
                } catch (e) {
                  document.getElementById("root").innerHTML = '<div style="color:red; padding:10px;">JSON Error: ' + e.message + '</div>';
                }
              } else {
                // ถ้ายังไม่เสร็จ ให้รออีก 100ms แล้วเช็คใหม่
                attempts++;
                if (attempts < maxRetries) {
                  setTimeout(checkLibraryAndRender, 100);
                } else {
                  document.getElementById("root").innerHTML = '<div style="color:red; padding:10px;">Failed to load Flex2HTML library. Please check internet connection.</div>';
                }
              }
            }

            // เริ่มเช็ค
            checkLibraryAndRender();
          })();
        </script>
      </body>
      </html>
    `;
  }, [json]);

  if (!json) return <div className="w-full h-full bg-slate-50" />;

  return (
    <div className="w-full h-full overflow-hidden rounded-lg border border-slate-200 bg-gray-50">
      <iframe
        srcDoc={srcDoc}
        className="w-full h-full border-none"
        title="Flex Message Preview"
        sandbox="allow-scripts" // อนุญาตให้รัน JS ใน iframe
      />
    </div>
  );
};

export default FlexRender;