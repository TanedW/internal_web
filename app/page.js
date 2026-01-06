// app/page.js
import LoginPage from './components/Login'; // ดึง Component Login ที่เราเพิ่งแก้กันมาแสดง

export default function Home() {
  return (
    <main>
      {/* แสดงหน้า Login ทันทีที่หน้าแรก โดยไม่ต้อง redirect ไปไหน */}
      <LoginPage />
    </main>
  );
}