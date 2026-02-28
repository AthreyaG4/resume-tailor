import { Button } from "../components/ui/button";
import { ArrowRight, CheckCircle, Upload } from "lucide-react";
import { useNavigate } from "react-router";

export function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Content Side */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Career Assistant
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            Tailor your resume for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              every job.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
            Stop sending generic resumes. Our AI analyzes job descriptions and
            rewrites your experience to match perfectly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              onClick={handleLogin}
              size="lg"
              className="btn-primary h-14 text-base px-8"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Intelligent Skill Matching",
              "Project Rewriting",
              "ATS Optimization",
              "Instant PDF Export",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-sm font-medium text-foreground/80"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Visual Side */}
      <div className="flex-1 bg-muted/30 border-l border-border relative hidden lg:flex items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mock UI Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden transform rotate-[-2deg]">
            <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="h-6 w-32 bg-primary/10 rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted/40 rounded" />
                <div className="h-4 w-5/6 bg-muted/40 rounded" />
                <div className="h-4 w-4/6 bg-muted/40 rounded" />
              </div>
              <div className="pt-4 flex gap-3">
                <div className="h-20 w-1/3 bg-blue-50 rounded-lg border border-blue-100" />
                <div className="h-20 w-1/3 bg-purple-50 rounded-lg border border-purple-100" />
                <div className="h-20 w-1/3 bg-green-50 rounded-lg border border-green-100" />
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              98%
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">
                Match Score
              </div>
              <div className="font-bold text-foreground">Senior Engineer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
