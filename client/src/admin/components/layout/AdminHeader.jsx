import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import { Bell, Menu, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/admin/components/ui/avatar";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-border shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex">
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-72 rounded-md bg-muted/70 px-3 py-2 text-sm shadow-inner border border-border focus-visible:ring-1 focus-visible:ring-primary transition-colors"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative hover:bg-accent transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-10 w-10 rounded-full focus:ring-2 focus:ring-ring">
                <Avatar className="h-10 w-10 ring-2 ring-border hover:ring-primary transition-all duration-300">
                  <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                  <AvatarFallback>Admin</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 mt-2 bg-background border border-border rounded-md shadow-xl"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-muted transition-colors">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted transition-colors">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-red-100 text-red-600 transition-colors">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

