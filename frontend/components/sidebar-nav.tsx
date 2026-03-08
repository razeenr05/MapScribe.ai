"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-context"
import {
  LayoutDashboard,
  Target,
  Network,
  BookOpen,
  Lightbulb,
  PlayCircle,
  Sparkles,
  LogOut,
  X,
  Flame,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Learn",
    href: "/learn",
    icon: Sparkles,
  },
  {
    title: "Mind Map",
    href: "/mindmap",
    icon: Network,
  },
  {
    title: "Practice",
    href: "/practice",
    icon: BookOpen,
  },
  {
    title: "Skill Assessment",
    href: "/assessment",
    icon: Target,
  },
  {
    title: "Resources",
    href: "/resources",
    icon: PlayCircle,
  },
]

interface SidebarNavProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary overflow-hidden">
            <Image
              src="/logo-mapscribe.png"
              alt="MapScribe.ai"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">MapScribe.ai</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation — large labels, start at top */}
      <nav className="flex-1 flex flex-col justify-start gap-0.5 px-3 pt-4 min-h-0 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3.5 text-lg font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6 shrink-0", isActive && "text-primary")} />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={logout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SidebarNav({ open, onOpenChange }: SidebarNavProps) {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent onClose={() => onOpenChange?.(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}