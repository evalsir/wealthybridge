//src/admin/components/tables/UserTable.jsx
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/admin/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-01-15",
    avatar: "JD",
  },
  {
    id: 2,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "User",
    status: "Active",
    lastLogin: "2024-01-14",
    avatar: "SW",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "User",
    status: "Inactive",
    lastLogin: "2024-01-10",
    avatar: "MJ",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@example.com",
    role: "Moderator",
    status: "Active",
    lastLogin: "2024-01-15",
    avatar: "EB",
  },
];

export function UserTable() {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const getStatusBadge = (status) => {
    const variant = status === "Active" ? "default" : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getRoleBadge = (role) => {
    const colors = {
      Admin: "destructive",
      Moderator: "default",
      User: "secondary",
    };
    return <Badge variant={colors[role] || "secondary"}>{role}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage user accounts and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`/avatars/${user.name
                          .toLowerCase()
                          .replace(" ", "")}.png`}
                      />
                      <AvatarFallback className="text-xs">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-md bg-white/90 backdrop-blur-md shadow-xl ring-1 ring-gray-200 dark:bg-gray-800/90 dark:ring-gray-700"
                    >
                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-800 dark:text-gray-200">
                          View Details
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                        <Edit className="h-4 w-4 text-yellow-600" />
                        <span className="text-gray-800 dark:text-gray-200">
                          Edit User
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                        <Trash2 className="h-4 w-4" />
                        <span className="text-red-600 dark:text-red-300">
                          Delete User
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
