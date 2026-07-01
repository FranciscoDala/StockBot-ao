"use client"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Context pra controlar a aba ativa sem Radix
type TabsContextType = { value: string; setValue: (v: string) => void }
const TabsContext = React.createContext<TabsContextType | null>(null)

function Tabs({ className, defaultValue, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { defaultValue: string }) {
  const [value, setValue] = React.useState(defaultValue)
  return <TabsContext.Provider value={{ value, setValue }}><div data-slot="tabs" className={cn("group/tabs flex gap-2 flex-col", className)} {...props}>{children}</div></TabsContext.Provider>
}

const tabsListVariants = cva("inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", {
  variants: { variant: { default: "bg-muted", line: "gap-1 bg-transparent" } },
  defaultVariants: { variant: "default" },
})

function TabsList({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof tabsListVariants>) {
  return <div data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)} {...props} />
}

function TabsTrigger({ className, value, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx?.value === value
  return (
    <button
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div data-slot="tabs-content" className={cn("mt-2 flex-1 text-sm outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }