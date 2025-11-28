"use client";
import type React from "react";
import Link from "next/link";

interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
}) => {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    // For LINK: DO NOT prevent default — allow Next.js navigation
    if (tag === "button") {
      event.preventDefault();
    }

    // Allow parent dropdown to close
    if (onItemClick) onItemClick();

    // Custom click handler
    if (onClick) onClick();
  };

  // LINK version
  if (tag === "a" && href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={combinedClasses}
        scroll={true}
      >
        {children}
      </Link>
    );
  }

  // BUTTON version
  return (
    <button onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
};
