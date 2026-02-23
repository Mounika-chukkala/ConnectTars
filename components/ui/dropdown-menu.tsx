"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null);

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "start" | "end" | "center";
}

export function DropdownMenu({ children, trigger, align = "end" }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ setOpen }}>
      <div className="relative" ref={menuRef}>
        <div onClick={() => setOpen(!open)}>{trigger}</div>
        {open && (
          <div
            className={cn(
              "absolute z-50 min-w-[180px] rounded-md border bg-background p-1 text-foreground shadow-md",
              align === "start" && "right-full -top-2 mr-2",
              align === "end" && "left-full -top-2 ml-2",
              align === "center" && "bottom-full left-1/2 -translate-x-1/2 mb-2"
            )}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: DropdownMenuItemProps) {
  const context = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (context) {
      context.setOpen(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
