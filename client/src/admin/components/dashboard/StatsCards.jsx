// src/admin/components/dashboard/StatsCards.jsx
import {
  DollarSign,
  Users,
  UserPlus,
  TrendingUp,
  PieChart,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";

const stats = [
  {
    title: "Total Shares Running",
    icon: TrendingUp,
    value: "$96,800",
    change: "+12.3%",
    bg: "bg-green-100 text-green-700",
  },
  {
    title: " Shares Sold",
    icon: PieChart,
    value: "$71,245",
    change: "+84.1%",
    bg: "bg-blue-100 text-blue-700",
  },
  {
    title: "New Clients",
    icon: UserPlus,
    value: "320",
    change: "+9.8%",
    bg: "bg-yellow-100 text-yellow-800",
  },
  {
    title: "Total Clients",
    icon: Users,
    value: "23.4k",
    change: "+2.5%",
    bg: "bg-purple-100 text-purple-800",
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="shadow-md border-none hover:shadow-lg transition"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change} from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
