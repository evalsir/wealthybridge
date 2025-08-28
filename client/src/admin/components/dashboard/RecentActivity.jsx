//src/admin/components/dashboard/RecentActivity.jsx
import { BellDot, UserCheck, CreditCard, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/admin/components/ui/card'

const activities = [
  {
    icon: UserCheck,
    title: 'New User Approved',
    description: 'James Otieno was approved by admin.',
    time: '2 mins ago',
  },
  {
    icon: CreditCard,
    title: 'Payment Received',
    description: 'Ksh 15,000 from Sharon Mwangi.',
    time: '45 mins ago',
  },
  {
    icon: FileText,
    title: 'Content Updated',
    description: 'Investment FAQs updated.',
    time: '1 hour ago',
  },
  {
    icon: BellDot,
    title: 'Withdrawal Alert',
    description: 'Elijah Oduor requested Ksh 8,000.',
    time: '3 hours ago',
  },
]

export function RecentActivity() {
  return (
    <Card className="col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-3 rounded-lg border hover:shadow-sm transition duration-200"
          >
            <div className="p-2 bg-muted rounded-md text-primary">
              <activity.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
