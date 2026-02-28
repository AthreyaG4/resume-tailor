import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Plus, Search, FileText, ArrowRight, Clock, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useApplications } from "../hooks/useApplications";
import { useResume } from "../hooks/useResume";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { applications, isLoading, createApplication, deleteApplication } =
    useApplications();
  const { resume } = useResume();
  const navigate = useNavigate();

  const [isNewAppOpen, setIsNewAppOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const applicationId = await createApplication(jobId);
      setIsNewAppOpen(false);
      navigate(`/applications/${applicationId}`);
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "tailoring":
        return "text-blue-600 bg-blue-50 border-blue-200"; // in progress
      case "interrupted":
        return "text-amber-600 bg-amber-50 border-amber-200"; // needs your attention
      case "tailored":
        return "text-violet-600 bg-violet-50 border-violet-200"; // ready to send
      case "applied":
        return "text-sky-600 bg-sky-50 border-sky-200"; // sent out
      case "interviewing":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"; // going well
      case "rejected":
        return "text-red-500 bg-red-50 border-red-200"; // closed
      case "failed":
        return "text-slate-500 bg-slate-50 border-slate-200"; // technical error
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const getStatusLabel = (app) => {
    return app.status.charAt(0).toUpperCase() + app.status.slice(1);
  };

  if (!isLoading && !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">
          Welcome to ResumeTailor
        </h2>
        <p className="text-muted-foreground mb-8">
          Before you can start creating tailored applications, you need to
          upload your master resume.
        </p>
        <Link to="/resume">
          <Button size="lg" className="btn-primary">
            Create Master Resume
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Manage your tailored resumes and job applications.
          </p>
        </div>

        <Dialog open={isNewAppOpen} onOpenChange={setIsNewAppOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
              <DialogDescription>
                Enter the job details to start tailoring your resume.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="jobId">Job ID / LinkedIn URL (Optional)</Label>
                <Input
                  id="jobId"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="e.g. 12345 or https://linkedin.com/jobs/..."
                />
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">
                  OR
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jd">Job Description</Label>
                <Textarea
                  id="jd"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={(!jobId && !jobDescription) || isCreating}
                className="w-full btn-primary"
              >
                {isCreating ? "Creating..." : "Start Tailoring"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {applications && applications.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-muted/10">
          <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Start by creating your first application. We'll help you tailor your
            resume to match the job description.
          </p>
          <Button variant="outline" onClick={() => setIsNewAppOpen(true)}>
            Create Application
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {applications?.map((app) => (
            <div key={app.id} className="relative group">
              <Link to={`/applications/${app.id}`}>
                <div className="relative rounded-2xl border border-border/60 bg-white hover:border-border hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4 h-full">
                  {/* top row — status + time */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusColor(app.status)}`}
                    >
                      {getStatusLabel(app)}
                    </span>
                    {app.created_at && (
                      <span className="text-[10px] text-muted-foreground/50 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(app.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>

                  {/* company + role */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-display font-black tracking-tight leading-snug">
                      {app.company_name || "Untitled Application"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {app.title || "Processing job details..."}
                    </p>
                  </div>

                  {/* match score if available */}
                  {app.skill_match_results?.final_score != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Match</span>
                        <span>
                          {Math.round(
                            app.skill_match_results.final_score * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            app.skill_match_results.final_score >= 0.7
                              ? "bg-emerald-500"
                              : app.skill_match_results.final_score >= 0.4
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                          style={{
                            width: `${Math.round(app.skill_match_results.final_score * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteApplication(app.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-muted-foreground/40"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
