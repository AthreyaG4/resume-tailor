import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SectionCard({ title, action, children }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-border/40 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold text-primary">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ResumeForm({ defaultValues, onSubmit, projectsSlot, experienceSlot }) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      skills: [],
      education: [],
      certifications: [],
      publications: [],
      ...defaultValues,
    },
  });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control: form.control, name: "education" });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control: form.control, name: "skills" });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control: form.control, name: "certifications" });

  const {
    fields: pubFields,
    append: appendPub,
    remove: removePub,
  } = useFieldArray({ control: form.control, name: "publications" });

  return (
    <form
      id="resume-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Personal details */}
      <SectionCard title="Personal details">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["name", "email", "phone", "linkedin", "github"].map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input {...form.register(field)} />
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard
        title="Skills"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSkill({ category: "", skills: [] })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add category
          </Button>
        }
      >
        <div className="space-y-4">
          {skillFields.map((field, index) => (
            <SkillCategoryField
              key={field.id}
              index={index}
              form={form}
              onRemove={() => removeSkill(index)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Projects — rendered by parent */}
      {projectsSlot}

      {/* Experience — rendered by parent */}
      {experienceSlot}

      {/* Education */}
      <SectionCard
        title="Education"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendEdu({
                institution: "",
                degree: "",
                field_of_study: "",
                location: "",
                start_date: "",
                end_date: "",
                gpa: "",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add education
          </Button>
        }
      >
        <div className="space-y-4">
          {eduFields.map((field, index) => (
            <Card key={field.id} className="relative group border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => removeEdu(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      {...form.register(`education.${index}.institution`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input {...form.register(`education.${index}.degree`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      {...form.register(`education.${index}.field_of_study`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      {...form.register(`education.${index}.start_date`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      {...form.register(`education.${index}.end_date`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input {...form.register(`education.${index}.gpa`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>

      {/* Certifications */}
      <SectionCard
        title="Certifications"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendCert({
                name: "",
                issuing_organization: "",
                issue_date: "",
                expiry_date: "",
                credential_id: "",
                credential_url: "",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add certification
          </Button>
        }
      >
        <div className="space-y-4">
          {certFields.map((field, index) => (
            <Card key={field.id} className="relative group border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => removeCert(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...form.register(`certifications.${index}.name`)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Issuing Organization</Label>
                    <Input
                      {...form.register(`certifications.${index}.issuing_organization`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      {...form.register(`certifications.${index}.issue_date`)}
                      placeholder="e.g. Jan 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      {...form.register(`certifications.${index}.expiry_date`)}
                      placeholder="e.g. Jan 2027 or leave blank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credential ID</Label>
                    <Input
                      {...form.register(`certifications.${index}.credential_id`)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Credential URL</Label>
                    <Input
                      {...form.register(`certifications.${index}.credential_url`)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>

      {/* Publications */}
      <SectionCard
        title="Publications"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendPub({
                title: "",
                authors: [],
                publication_venue: "",
                publication_date: "",
                url: "",
                description: "",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add publication
          </Button>
        }
      >
        <div className="space-y-4">
          {pubFields.map((field, index) => (
            <PublicationField
              key={field.id}
              index={index}
              form={form}
              onRemove={() => removePub(index)}
            />
          ))}
        </div>
      </SectionCard>
    </form>
  );
}

function SkillCategoryField({ index, form, onRemove }) {
  const [newSkill, setNewSkill] = useState("");
  const skills = form.watch(`skills.${index}.skills`) || [];

  const addSkill = () => {
    if (newSkill.trim()) {
      form.setValue(`skills.${index}.skills`, [...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (i) => {
    form.setValue(
      `skills.${index}.skills`,
      skills.filter((_, idx) => idx !== i),
    );
  };

  return (
    <Card className="relative group border-border/60">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            {...form.register(`skills.${index}.category`)}
            placeholder="e.g. Languages, Frameworks"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {skills.map((skill, i) => (
              <motion.div
                key={`${skill}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeSkill(i)}
                  className="group hover:bg-destructive/10 hover:text-destructive pl-3 pr-2"
                >
                  {skill}
                  <X className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add skill..."
              className="w-32 h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addSkill}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PublicationField({ index, form, onRemove }) {
  const [newAuthor, setNewAuthor] = useState("");
  const authors = form.watch(`publications.${index}.authors`) || [];

  const addAuthor = () => {
    if (newAuthor.trim()) {
      form.setValue(`publications.${index}.authors`, [...authors, newAuthor.trim()]);
      setNewAuthor("");
    }
  };

  const removeAuthor = (i) => {
    form.setValue(
      `publications.${index}.authors`,
      authors.filter((_, idx) => idx !== i),
    );
  };

  return (
    <Card className="relative group border-border/60">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...form.register(`publications.${index}.title`)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              {...form.register(`publications.${index}.publication_venue`)}
              placeholder="e.g. NeurIPS, Nature"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              {...form.register(`publications.${index}.publication_date`)}
              placeholder="e.g. Dec 2023"
            />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              {...form.register(`publications.${index}.url`)}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            {...form.register(`publications.${index}.description`)}
            className="min-h-[80px]"
            placeholder="Brief abstract or summary..."
          />
        </div>
        <div className="space-y-2">
          <Label>Authors</Label>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {authors.map((author, i) => (
                <motion.div
                  key={`${author}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeAuthor(i)}
                    className="group hover:bg-destructive/10 hover:text-destructive pl-3 pr-2"
                  >
                    {author}
                    <X className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex gap-2">
              <Input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAuthor();
                  }
                }}
                placeholder="Add author..."
                className="w-40 h-8 text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={addAuthor}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
