export default function Manage() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center font-sans">
      {/* ถ้าในโปรเจคมีการ import Tailwind/DaisyUI ที่ layout หลักแล้ว ไม่ต้องใส่ link/script ด้านล่างนี้ครับ */}
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      <div className="card bg-base-100 shadow-xl p-10">
        <h1 className="text-5xl font-bold text-primary">
          hey วัยรุ่น
        </h1>
      </div>
    </div>
  );
}