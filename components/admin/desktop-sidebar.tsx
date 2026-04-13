"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

interface DesktopSidebarProps {
  navigation: { name: string; href: string; icon: any }[]
  messagesUnread: number
  notificationsUnread: number
}

export function DesktopSidebar({ navigation, messagesUnread, notificationsUnread }: DesktopSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.href === '/admin/messages' && messagesUnread > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {messagesUnread}
                      </Badge>
                    )}
                    {item.href === '/admin/notifications' && notificationsUnread > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {notificationsUnread}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
