"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ADMIN_PASSWORD = "koftan123"

export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Generate a session token from the password
    const generateSessionToken = (pwd: string) => {
      return btoa(pwd + Date.now().toString()); // Simple token generation
    };

    const checkSession = () => {
      const sessionToken = localStorage.getItem('admin-session');
      const sessionExpiry = localStorage.getItem('admin-session-expiry');
      
      if (sessionToken && sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        if (Date.now() < expiryTime) {
          setIsAuthenticated(true);
          setOpen(false);
          return;
        }
        // Clear expired session
        localStorage.removeItem('admin-session');
        localStorage.removeItem('admin-session-expiry');
      }
    };

    checkSession();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      // Set session in localStorage with 24-hour expiry
      const sessionToken = btoa(password + Date.now().toString());
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      localStorage.setItem('admin-session', sessionToken);
      localStorage.setItem('admin-session-expiry', expiryTime.toString());
      
      setIsAuthenticated(true);
      setOpen(false);
    } else {
      setError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          router.push("/");
        }
      }}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={error ? "border-red-500" : ""}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">Incorrect password</p>
            )}
            <Button type="submit" className="w-full">
              Access Admin Panel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
