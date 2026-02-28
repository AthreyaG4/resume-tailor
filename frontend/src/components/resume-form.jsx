import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ResumeForm({ defaultValues, onSubmit, isSubmitting }) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      summary: "",
      skills: [],
      experience: [],
      projects: [],
      education: [],
      ...defaultValues,
    },
  });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control: form.control, name: "experience" });
  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({ control: form.control, name: "projects" });
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

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-12 max-w-4xl mx-auto"
    >
      {/* Personal Info */}
      <section className="space-y-6">
        <h2 className="text-2xl font-display font-semibold text-primary">
          Personal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["name", "email", "phone", "linkedin", "github"].map((field) => (
            <div key={field} className="space-y-2">
              <Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
              <Input {...form.register(field)} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea {...form.register("summary")} className="min-h-[100px]" />
        </div>
      </section>

      {/* Skills */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-primary">
            Skills
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSkill({ category: "", skills: [] })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>
        {skillFields.map((field, index) => (
          <SkillCategoryField
            key={field.id}
            index={index}
            form={form}
            onRemove={() => removeSkill(index)}
          />
        ))}
      </section>

      {/* Experience */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-primary">
            Experience
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendExp({
                company: "",
                role: "",
                location: "",
                start_date: "",
                end_date: "",
                bullets: [],
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add Position
          </Button>
        </div>
        {expFields.map((field, index) => (
          <Card key={field.id} className="relative group border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={() => removeExp(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input {...form.register(`experience.${index}.company`)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input {...form.register(`experience.${index}.role`)} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input {...form.register(`experience.${index}.location`)} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    {...form.register(`experience.${index}.start_date`)}
                    placeholder="Jan 2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    {...form.register(`experience.${index}.end_date`)}
                    placeholder="Present"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  {...form.register(`experience.${index}.description`)}
                  className="min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Projects */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-primary">
            Projects
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendProject({
                title: "",
                description: "",
                technologies: [],
                bullets: [],
                link: "",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projectFields.map((field, index) => (
            <Card key={field.id} className="relative group border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => removeProject(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input {...form.register(`projects.${index}.title`)} />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    {...form.register(`projects.${index}.link`)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    {...form.register(`projects.${index}.description`)}
                    className="min-h-[300px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-primary">
            Education
          </h2>
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
            <Plus className="w-4 h-4 mr-2" /> Add Education
          </Button>
        </div>
        {eduFields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-4 items-start bg-muted/30 p-4 rounded-lg group"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input {...form.register(`education.${index}.institution`)} />
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
                <Input {...form.register(`education.${index}.start_date`)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input {...form.register(`education.${index}.end_date`)} />
              </div>
              <div className="space-y-2">
                <Label>GPA</Label>
                <Input {...form.register(`education.${index}.gpa`)} />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 text-destructive mt-8"
              onClick={() => removeEdu(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </section>

      <div className="sticky bottom-6 flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="btn-primary shadow-2xl"
        >
          {isSubmitting ? "Saving..." : "Save Master Resume"}
        </Button>
      </div>
    </form>
  );
}

// Reusable bullets field component
// function BulletsField({ form, name }) {
//   const { fields, append, remove } = useFieldArray({
//     control: form.control,
//     name,
//   });
//   const [newBullet, setNewBullet] = useState("");

//   return (
//     <div className="space-y-2">
//       <Label>Bullets</Label>
//       <div className="space-y-2">
//         {fields.map((field, i) => (
//           <div key={field.id} className="flex gap-2 items-center">
//             <Input {...form.register(`${name}.${i}`)} className="flex-1" />
//             <Button
//               type="button"
//               variant="ghost"
//               size="icon"
//               onClick={() => remove(i)}
//             >
//               <X className="w-4 h-4" />
//             </Button>
//           </div>
//         ))}
//         <div className="flex gap-2">
//           <Input
//             value={newBullet}
//             onChange={(e) => setNewBullet(e.target.value)}
//             placeholder="Add bullet point..."
//             onKeyDown={(e) => {
//               if (e.key === "Enter") {
//                 e.preventDefault();
//                 append(newBullet);
//                 setNewBullet("");
//               }
//             }}
//           />
//           <Button
//             type="button"
//             variant="outline"
//             size="icon"
//             onClick={() => {
//               append(newBullet);
//               setNewBullet("");
//             }}
//           >
//             <Plus className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// Skill category field component
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
