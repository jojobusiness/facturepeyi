import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold transition duration-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
