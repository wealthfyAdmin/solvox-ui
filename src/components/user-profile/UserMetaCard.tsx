"use client";
import React from "react";
import Image from "next/image";

interface UserMetaProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    organization_name?: string;
    profile_photo?: string;
  };
}

export default function UserMetaCard({ user }: UserMetaProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        {/* Avatar + Name + Role */}
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          {/* Profile Image */}
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <Image
              width={80}
              height={80}
              src={user?.profile_photo || "/images/user/owner.jpg"}
              alt="user profile"
            />
          </div>

          {/* Name + Role + Organization */}
          <div className="order-3 xl:order-2">
            {/* User Name */}
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user?.name || "User"}
            </h4>

            {/* Role + Organization (conditional pipe) */}
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role || "User"}
              </p>

              {/* Show pipe only if organization exists */}
              {user?.organization_name && (
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              )}

              {/* Show organization only if exists */}
              {user?.organization_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.organization_name}
                </p>
              )}
            </div>
          </div>
        </div>

       

      </div>
    </div>
  );
}
