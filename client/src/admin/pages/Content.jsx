//src/admin/pages/content.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        {/* Header Section */}
<header className="text-center space-y-4">
  <div className="flex justify-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 shadow-sm">
      <svg
        className="w-8 h-8 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    </div>
  </div>

  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
    Content Management
  </h1>

  <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
    Streamline your platform’s dynamic content — from plans and tips to banners and testimonials — 
    all in one unified space.
  </p>
</header>


        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              title: "Investment Plans",
              description: "Edit fixed-percentage plans, durations, and expected returns with advanced analytics.",
              action: "Manage Plans",
              icon: "📈",
              color: "from-blue-500/10 to-blue-600/5",
              border: "border-blue-200/50",
            },
            {
              title: "Investor Tips",
              description: "Add or modify pre-investment guidance and best practices for your users.",
              action: "Update Tips",
              icon: "💡",
              color: "from-amber-500/10 to-amber-600/5",
              border: "border-amber-200/50",
            },
            {
              title: "Terms & Conditions",
              description: "Review or edit platform policies, disclaimers, and legal warnings.",
              action: "Edit Terms",
              icon: "📋",
              color: "from-green-500/10 to-green-600/5",
              border: "border-green-200/50",
            },
            {
              title: "Bonuses & Rewards",
              description: "Manage long-term investment bonuses and comprehensive reward schemes.",
              action: "Configure Bonuses",
              icon: "🎁",
              color: "from-purple-500/10 to-purple-600/5",
              border: "border-purple-200/50",
            },
            {
              title: "User Testimonials",
              description: "Approve and showcase authentic feedback from satisfied platform users.",
              action: "Manage Testimonials",
              icon: "⭐",
              color: "from-rose-500/10 to-rose-600/5",
              border: "border-rose-200/50",
            },
            {
              title: "Homepage Banners",
              description: "Control promotional banners and engaging homepage messages.",
              action: "Go to Banners",
              icon: "🎨",
              color: "from-indigo-500/10 to-indigo-600/5",
              border: "border-indigo-200/50",
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 border-2 ${item.border} bg-gradient-to-br ${item.color} backdrop-blur-sm`}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-card/95 to-card/98 group-hover:from-card/98 group-hover:to-card transition-all duration-300" />
              
              {/* Content */}
              <div className="relative">
                <CardHeader className="pb-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{item.icon}</div>
                    <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <button className="w-full bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]">
                    {item.action}
                    <svg className="inline-block ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </CardContent>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium"></span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;