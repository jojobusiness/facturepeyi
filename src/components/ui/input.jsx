import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`border rounded-xl px-4 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${className}`}
      {...props}
    />
  );
}
