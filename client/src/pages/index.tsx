import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BarChart3, Users, CreditCard, Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your business with powerful analytics, user management, and comprehensive oversight tools.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6">
              Access Dashboard
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Comprehensive user administration and role management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Real-time insights and performance metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Financial oversight and payment processing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Administration</CardTitle>
              <CardDescription>
                System settings and configuration management
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
