import { useState } from "react";
import { ResumeForm } from "../components/resume-form";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Sparkles,
  Search,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { useResume } from "../hooks/useResume";
import { toast } from "../components/ui/sonner.jsx";

export default function ResumePage() {
  const { resume, loading, parseResume, saveResume, deleteResume } =
    useResume();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        parseResume(acceptedFiles[0]);
      }
    },
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">
            Upload Master Resume
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            We'll parse your existing resume to get you started quickly.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem] -m-6" />
          <Card className="border-2 border-dashed border-border/60 overflow-hidden relative bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl hover:border-primary/40 transition-all group">
            <div
              {...getRootProps()}
              className={`p-20 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragActive
                  ? "bg-primary/5 border-primary shadow-inner"
                  : "hover:bg-muted/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">
                {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                Supported formats: PDF. Max file size 10MB.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-xl font-bold border-border/60 hover:bg-white hover:text-primary transition-all active:scale-95 shadow-sm"
              >
                Select File
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-16 flex justify-center items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-lg shadow-primary/20">
              1
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              Upload
            </span>
          </div>
          <div className="w-16 h-0.5 bg-muted-foreground/10 rounded-full" />
          <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
            <div className="w-10 h-10 rounded-2xl border-2 border-dashed border-border flex items-center justify-center font-black">
              2
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              Review
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (resume.status == "parsing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-primary/10">
            <FileText className="w-16 h-16 text-primary" />
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-display font-black tracking-tight mb-4">
          Analyzing Your Experience
        </h2>
        <div className="max-w-md mx-auto space-y-6">
          <p className="text-muted-foreground font-medium leading-relaxed">
            Our agent is extracting key achievements and skills to build your
            master profile. This will take just a moment...
          </p>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: "0%", opacity: 1 }}
              animate={{ width: "100%", opacity: 0 }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.8,
              }}
              className="bg-primary h-full"
            />
          </div>

          <div className="flex justify-center gap-8 pt-4">
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Upload
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Parsing
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-40">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Review
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resume.status == "success") {
    const initialData = resume?.resume_json;

    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight mb-2">
              Master Resume
            </h1>
            <p className="text-muted-foreground font-medium">
              This is the base information used to tailor your applications.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-4 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Resume
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-border/60 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-display font-black tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    Reset Master Resume?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-md font-medium pt-2">
                    This will permanently delete your master resume data. You'll
                    need to upload a fresh file to continue tailoring
                    applications.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4 gap-3">
                  <AlertDialogCancel className="h-12 px-6 rounded-xl font-bold border-border/60">
                    Keep it
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteResume()}
                    className="h-12 px-8 rounded-xl bg-destructive hover:bg-destructive/90 font-black shadow-lg shadow-destructive/20"
                  >
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-border/40 p-8 shadow-sm">
          <ResumeForm
            defaultValues={initialData}
            onSubmit={(data) => {
              try {
                saveResume(data);
                toast.success("Resume successfully saved");
              } catch (err) {
                toast.error(`Error saving resume: ${str(err)}`);
              }
            }}
          />
        </div>
      </div>
    );
  }
}
