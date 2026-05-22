import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={cn(
        "relative z-50 w-full max-w-md transform overflow-hidden rounded-2xl bg-surface p-6 text-left align-middle shadow-xl transition-all m-4",
        "fade-in",
        className
      )}>
        {title && (
          <h3 className="text-2xl font-heading font-medium leading-6 text-gray-900 mb-4">
            {title}
          </h3>
        )}
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
