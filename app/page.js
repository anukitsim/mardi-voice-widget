import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
          Mardi Voice Assistant Widget
        </h1>
        <p className="mt-4 text-lg text-gray-600 font-[family-name:var(--font-noto-sans-georgian)]">
          Production-ready voice assistant widget coming soon...
        </p>
      </div>
    </div>
  );
}
