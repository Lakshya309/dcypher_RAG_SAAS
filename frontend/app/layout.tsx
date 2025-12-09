import "./globals.css";
import AnimatedNavbar from "@/components/shared/AnimatedNavbar";
import Footer from "@/components/shared/Footer";
import RouteTransition from "@/components/shared/RouteTransition";
import SessionProvider from "@/context/ClientSessionProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <AnimatedNavbar />
          <RouteTransition>
            <main className="min-h-screen">{children}</main>
          </RouteTransition>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
