import * as React from "react";

export function TooltipProvider({ children }) {
  return <>{children}</>;
}

export function Tooltip({ children }) {
  return (
    <div className="relative group inline-block">
      {children}
    </div>
  );
}

export function TooltipTrigger({ children }) {
  return children;
}

export function TooltipContent({ children }) {
  return (
    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded-md px-2 py-1 z-10">
      {children}
    </div>
  );
}
