"use client";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useVisitTracker } from "@/hooks/useVisitTracker";

function VisitTrackerMount() {
  useVisitTracker();
  return null;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTrackerMount />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
