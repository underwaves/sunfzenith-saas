import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="pastel-card max-w-md p-10 text-center animate-pop-in">
        <p className="text-6xl">🌙</p>
        <p className="mt-4 text-sm font-bold tracking-[0.3em] text-pastel-purple">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-pastel-deep">ไม่พบหน้าที่คุณกำลังหา</h1>
        <p className="mt-2 text-sm text-pastel-deep/70">หน้านี้อาจถูกย้าย หรือพิมพ์ลิงก์ไม่ถูกต้อง ลองกลับไปเริ่มใหม่จากหน้าแรกนะคะ</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-magical btn-cute">กลับหน้าแรก</Link>
          <Link href="/dashboard" className="btn-soft">ไปที่แดชบอร์ด</Link>
        </div>
      </div>
    </main>
  );
}
