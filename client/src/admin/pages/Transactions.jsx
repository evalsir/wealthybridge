//src/admin/pages/transaction.jsx
import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/admin/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/admin/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

const transactions = [
  {
    id: "TXN001",
    name: "John Doe",
    withdrawal: "$1,200",
    deposit: "$0",
    status: "Completed",
    date: "2025-07-25",
  },
  {
    id: "TXN002",
    name: "Jane Smith",
    withdrawal: "$0",
    deposit: "$2,500",
    status: "Pending",
    date: "2025-07-24",
  },
  {
    id: "TXN003",
    name: "David King",
    withdrawal: "$950",
    deposit: "$0",
    status: "Failed",
    date: "2025-07-23",
  },
  {
    id: "TXN004",
    name: "Alice Johnson",
    withdrawal: "$0",
    deposit: "$3,800",
    status: "Completed",
    date: "2025-07-22",
  },
];

const statusColor = {
  Completed: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Failed: "bg-red-100 text-red-800",
};

export default function Transactions() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Track and manage financial transactions
        </p>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Overview of recent transactions</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-blue-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Withdrawal</th>
                    <th className="px-4 py-3">Deposit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-blue-50">
                      <td className="px-4 py-3 font-medium">{txn.id}</td>
                      <td className="px-4 py-3">{txn.name}</td>
                      <td className="px-4 py-3">{txn.withdrawal}</td>
                      <td className="px-4 py-3">{txn.deposit}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            statusColor[txn.status]
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{txn.date}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="bg-gray-100 shadow-md rounded-md border border-gray-200"
                          >
                            <DropdownMenuItem className="hover:bg-green-100 text-green-700 font-medium">
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-red-100 text-red-600 font-medium">
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
