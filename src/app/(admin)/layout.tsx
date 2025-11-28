"use client";
"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import CreateOrganizationModal from "@/components/agents/create-organization-modal";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          router.push("/signin");
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        setUser(data);

        // Show popup ONLY for role === "user"
        if (data.role === "user" && !data.organization_id) {
          setOrgModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to load user", err);
      }
    };

    fetchUser();
  }, [router]);

  const handleOrganizationCreate = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const updatedUser = await res.json();
      setUser(updatedUser);
      setOrgModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <>
      {/* Popup Overlay (covers header + sidebar fully) */}
      {orgModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <CreateOrganizationModal
            open={orgModalOpen}
            onClose={user?.role === "user" ? () => {} : () => setOrgModalOpen(false)}
            onCreate={handleOrganizationCreate}
            disableClose={user?.role === "user"}
          />
        </div>
      )}

      {/* Blur full layout when popup is open */}
      <div className={orgModalOpen ? "blur-sm pointer-events-none" : ""}>
        <div className="min-h-screen xl:flex">
          <AppSidebar />
          <Backdrop />

          <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
            <AppHeader />

            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
              <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
