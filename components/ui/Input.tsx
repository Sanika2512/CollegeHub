import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("min-h-11 w-full rounded-md border bg-white px-3 text-sm outline-none ring-primary/20 transition placeholder:text-slate-400 focus:ring-4", className)}
    {...props}
  />
));

Input.displayName = "Input";
