"use client";
import React, { useState, useEffect } from "react";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import LoadingSpinner from "@/components/ui/loadingspinner/loadingspinner";

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };
    load();
  }, []);

  // 👉 use LoadingSpinner instead of "Loading..."
  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner className="h-12 w-12 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );

  return (
    <div>
      <PageBreadcrumb pageTitle="Profile" />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03] p-5 dark:border-gray-800 lg:p-6">
        <div className="space-y-6">
          <UserMetaCard user={user} />
          <UserInfoCard user={user} setUser={setUser} />
        </div>
      </div>
    </div>
  );
}
