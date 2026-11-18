"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex h-10 w-full items-center gap-1 rounded-md bg-ui-muted p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-8 flex-1 cursor-pointer before:absolute before:inset-x-0 before:-inset-y-1.5 items-center justify-center rounded-sm px-3 text-sm font-medium text-ui-fg-muted transition-colors",
        "hover:text-ui-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring",
        "data-[state=active]:bg-ui-card data-[state=active]:text-ui-fg data-[state=active]:shadow-ui-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("focus-visible:outline-none", className)} {...props} />;
}
