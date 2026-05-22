'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <nav className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-heading font-bold text-2xl text-primary">SnipQ</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  Hello, {user?.name.split(' ')[0]}
                </span>
                
                {user?.role === 'CUSTOMER' && (
                  <Link href="/history">
                    <Button variant="ghost" size="sm">History</Button>
                  </Link>
                )}
                {user?.role === 'OWNER' && (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                )}
                {user?.role === 'BARBER' && (
                  <Link href="/queue-dashboard">
                    <Button variant="ghost" size="sm">Queue</Button>
                  </Link>
                )}

                <Button variant="secondary" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
