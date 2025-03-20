"use client";
import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from "lucide-react";

const Management = () => {
  const router = useRouter()
  const { data: session, status } = useSession();
  
  useEffect(() => {
    // Only redirect if we're certain there's no session
    if (status === "unauthenticated") {
      router.push('/sign-in')
    }
  }, [status, router])
  
  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-slate-700"></div>
    </div>
    )
  }
  
  // Only render page content if authenticated
  if (status === "authenticated") {
    return (
      <div>Management</div>
    )
  }
  
  // Return empty during redirect
  return null
}

export default Management