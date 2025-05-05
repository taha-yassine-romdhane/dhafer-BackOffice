'use client'

import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
    </div>
  )
}
