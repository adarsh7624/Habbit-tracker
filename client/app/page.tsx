import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Build Better Habits, <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                Master Your Life
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track your daily habits, analyze your progress with AI insights, and gamify your personal growth journey.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Daily Consistency</h3>
                <p className="text-muted-foreground">Track your habits daily and build unbreakable streaks that keep you motivated.</p>
              </div>

              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Visual Analytics</h3>
                <p className="text-muted-foreground">Visualize your progress with heatmaps, charts, and detailed insights.</p>
              </div>

              <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gamified Growth</h3>
                <p className="text-muted-foreground">Earn XP, level up, and unlock achievements as you transform your life.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t text-center text-muted-foreground text-sm">
        <p>&copy; 2026 HabitFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
