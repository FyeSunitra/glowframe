/* Auth layout — full-screen brown background */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gf-brown-800 flex items-center justify-center [padding:40px_24px]">
      {children}
    </div>
  );
}
