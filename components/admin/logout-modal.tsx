"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/components/admin/session-provider"

interface LogoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { logout } = useSession()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      toast({
        variant: "success",
        title: "Logged out successfully",
        description: "You've been safely signed out of your account.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error signing you out. Please try again.",
      })
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-slide-up">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" />
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You'll need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleLogout} disabled={isLoading} variant="destructive">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
