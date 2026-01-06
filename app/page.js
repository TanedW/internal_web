// app/page.js
import Navbar from './components/Navbar'; // สมมติว่าเราจะสร้าง Navbar

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-6">
          สวัสดี Next.js + Tailwind!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">
          การเขียนเว็บด้วย JSX และ Utility classes ทำให้เราสร้าง UI ได้รวดเร็วและสวยงามโดยไม่ต้องเขียนไฟล์ CSS แยก
        </p>
        
        <div className="flex gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300">
            เริ่มต้นใช้งาน
          </button>
          <button className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 font-bold py-3 px-6 rounded-lg transition duration-300">
            อ่านเอกสาร
          </button>
        </div>
      </section>

      {/* Grid Section */}
      <section className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* เรียกใช้ Card Component */}
         <Card title="ความเร็วสูง" icon="🚀" />
         <Card title="SEO ดีเยี่ยม" icon="🔍" />
         <Card title="ปรับแต่งง่าย" icon="🎨" />
      </section>
    </main>
  );
}

// สร้าง Component เล็กๆ ไว้ในไฟล์เดียวกันก็ได้ (หรือแยกไฟล์ก็ได้)
function Card({ title, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-500">
        Tailwind ช่วยให้การจัด Layout แบบ Grid และ Flex เป็นเรื่องง่ายมาก
      </p>
    </div>
  );
}