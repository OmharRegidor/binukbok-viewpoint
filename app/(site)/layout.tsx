import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Marketing-site chrome (shared header + footer). Utility pages outside this
// group (e.g. /b/[token] booking pass) render without it.
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
