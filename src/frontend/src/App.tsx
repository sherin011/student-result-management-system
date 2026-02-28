import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calculator,
  ClipboardList,
  GraduationCap,
  Loader2,
  PlusCircle,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useAddResult,
  useDeleteResult,
  useGetResults,
} from "./hooks/useQueries";

interface SubjectField {
  key: "maths" | "science" | "english" | "tamil" | "computerScience";
  label: string;
  icon: string;
}

const SUBJECTS: SubjectField[] = [
  { key: "maths", label: "Mathematics", icon: "📐" },
  { key: "science", label: "Science", icon: "🔬" },
  { key: "english", label: "English", icon: "📖" },
  { key: "tamil", label: "Tamil", icon: "✍️" },
  { key: "computerScience", label: "Computer Science", icon: "💻" },
];

interface FormValues {
  studentName: string;
  rollNumber: string;
  maths: string;
  science: string;
  english: string;
  tamil: string;
  computerScience: string;
}

interface FormErrors {
  studentName?: string;
  rollNumber?: string;
  maths?: string;
  science?: string;
  english?: string;
  tamil?: string;
  computerScience?: string;
}

interface CalculatedResult {
  total: number;
  average: number;
  grade: string;
  marks: { [key: string]: number };
}

function computeGrade(
  average: number,
  marks: { [key: string]: number },
): string {
  const hasFailingSubject = Object.values(marks).some((m) => m < 35);
  if (hasFailingSubject || average < 40) return "Fail";
  if (average >= 80) return "A";
  if (average >= 60) return "B";
  return "C";
}

function GradeBadge({ grade }: { grade: string }) {
  const classMap: Record<string, string> = {
    A: "grade-badge-a",
    B: "grade-badge-b",
    C: "grade-badge-c",
    Fail: "grade-badge-fail",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-display ${classMap[grade] || "grade-badge-c"}`}
    >
      {grade}
    </span>
  );
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.studentName.trim()) {
    errors.studentName = "Student name is required";
  }
  if (!values.rollNumber.trim()) {
    errors.rollNumber = "Roll number is required";
  }

  for (const { key, label } of SUBJECTS) {
    const raw = values[key];
    if (raw === "" || raw === undefined) {
      errors[key] = `${label} marks required`;
    } else {
      const num = Number(raw);
      if (!Number.isInteger(num) || Number.isNaN(num)) {
        errors[key] = "Enter a whole number";
      } else if (num < 0 || num > 100) {
        errors[key] = "Marks must be 0–100";
      }
    }
  }

  return errors;
}

export default function App() {
  const [formValues, setFormValues] = useState<FormValues>({
    studentName: "",
    rollNumber: "",
    maths: "",
    science: "",
    english: "",
    tamil: "",
    computerScience: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [calculated, setCalculated] = useState<CalculatedResult | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { data: results = [], isLoading: resultsLoading } = useGetResults();
  const {
    isActorReady,
    mutateAsync: addResult,
    isPending: isAddPending,
  } = useAddResult();
  const deleteResultMutation = useDeleteResult();

  const handleChange = useCallback(
    (field: keyof FormValues, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      // Clear calculated result if form changes
      setCalculated(null);
    },
    [errors],
  );

  const handleCalculate = useCallback(() => {
    const newErrors = validateForm(formValues);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors before calculating");
      return;
    }

    const marks = {
      maths: Number(formValues.maths),
      science: Number(formValues.science),
      english: Number(formValues.english),
      tamil: Number(formValues.tamil),
      computerScience: Number(formValues.computerScience),
    };
    const total = Object.values(marks).reduce((a, b) => a + b, 0);
    const average = total / 5;
    const grade = computeGrade(average, marks);

    setCalculated({ total, average, grade, marks });
    toast.success("Results calculated successfully!");
  }, [formValues]);

  const handleAddToRecords = useCallback(async () => {
    if (!calculated) return;
    setIsAdding(true);
    try {
      await addResult({
        rollNumber: formValues.rollNumber.trim(),
        studentName: formValues.studentName.trim(),
        maths: calculated.marks.maths,
        science: calculated.marks.science,
        english: calculated.marks.english,
        tamil: calculated.marks.tamil,
        computerScience: calculated.marks.computerScience,
        total: calculated.total,
        average: calculated.average,
        grade: calculated.grade,
      });
      toast.success(`Record added for ${formValues.studentName}!`);
      // Reset form
      setFormValues({
        studentName: "",
        rollNumber: "",
        maths: "",
        science: "",
        english: "",
        tamil: "",
        computerScience: "",
      });
      setCalculated(null);
      setErrors({});
    } catch {
      toast.error("Failed to add record. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }, [calculated, formValues, addResult]);

  const handleDelete = useCallback(
    async (id: bigint) => {
      try {
        await deleteResultMutation.mutateAsync(id);
        toast.success("Record deleted");
      } catch {
        toast.error("Failed to delete record");
      }
    },
    [deleteResultMutation],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="header-gradient header-pattern">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Student Result Management
              </h1>
              <p className="text-white/85 text-sm mt-0.5 font-body">
                Academic Performance Tracker
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Entry Form Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          aria-labelledby="form-heading"
        >
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2
                id="form-heading"
                className="font-semibold text-foreground text-lg"
              >
                Enter Student Details
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Student Info */}
                <div className="space-y-2">
                  <Label
                    htmlFor="studentName"
                    className="text-sm font-medium text-foreground"
                  >
                    Student Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    placeholder="e.g. Arjun Kumar"
                    value={formValues.studentName}
                    onChange={(e) =>
                      handleChange("studentName", e.target.value)
                    }
                    className={`font-body ${errors.studentName ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    autoComplete="off"
                  />
                  {errors.studentName && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="rollNumber"
                    className="text-sm font-medium text-foreground"
                  >
                    Roll Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rollNumber"
                    type="text"
                    placeholder="e.g. 2024CS001"
                    value={formValues.rollNumber}
                    onChange={(e) => handleChange("rollNumber", e.target.value)}
                    className={`font-body ${errors.rollNumber ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    autoComplete="off"
                  />
                  {errors.rollNumber && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.rollNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject Marks */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground/75 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Subject Marks (0–100)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {SUBJECTS.map(({ key, label, icon }) => (
                    <div key={key} className="space-y-2">
                      <Label
                        htmlFor={key}
                        className="text-sm font-medium text-foreground flex items-center gap-1.5"
                      >
                        <span>{icon}</span>
                        {label.split(" ")[0]}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0–100"
                        value={formValues[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`font-body text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors[key] ? "border-destructive" : ""}`}
                      />
                      {errors[key] && (
                        <p className="text-destructive text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={handleCalculate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-display gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate Results
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Calculated Results Summary */}
        <AnimatePresence>
          {calculated && (
            <motion.section
              key="result-summary"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              aria-labelledby="summary-heading"
            >
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center gap-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h2
                    id="summary-heading"
                    className="font-semibold text-foreground text-lg"
                  >
                    Result Summary — {formValues.studentName}
                  </h2>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border border-l-4 border-l-primary">
                      <p className="text-xs text-foreground/70 font-semibold uppercase tracking-wider mb-1">
                        Total
                      </p>
                      <p className="text-3xl font-bold text-foreground font-display">
                        {calculated.total}
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        out of 500
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border border-l-4 border-l-sky-400">
                      <p className="text-xs text-foreground/70 font-semibold uppercase tracking-wider mb-1">
                        Average
                      </p>
                      <p className="text-3xl font-bold text-foreground font-display">
                        {calculated.average.toFixed(2)}%
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        percentage
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border border-l-4 border-l-teal-500">
                      <p className="text-xs text-foreground/65 font-semibold uppercase tracking-wider mb-1">
                        Grade
                      </p>
                      <div className="flex justify-center mt-1">
                        <span
                          className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold font-display border-2 ${
                            calculated.grade === "A"
                              ? "grade-badge-a"
                              : calculated.grade === "B"
                                ? "grade-badge-b"
                                : calculated.grade === "C"
                                  ? "grade-badge-c"
                                  : "grade-badge-fail"
                          }`}
                        >
                          {calculated.grade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Per-subject marks breakdown */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                      Subject-wise Breakdown
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {SUBJECTS.map(({ key, label, icon }) => {
                        const mark = calculated.marks[key];
                        const failed = mark < 35;
                        return (
                          <div
                            key={key}
                            className={`rounded-lg p-3 text-center border ${failed ? "border-destructive/40 bg-destructive/5" : "border-border bg-secondary/30"}`}
                          >
                            <p className="text-lg mb-0.5">{icon}</p>
                            <p className="text-xs text-foreground/65 leading-tight mb-1">
                              {label.split(" ")[0]}
                            </p>
                            <p
                              className={`text-lg font-bold font-display ${failed ? "text-destructive" : "text-foreground"}`}
                            >
                              {mark}
                            </p>
                            {failed && (
                              <p className="text-[10px] text-destructive font-medium">
                                Below min
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToRecords}
                    disabled={isAdding || isAddPending || !isActorReady}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-display gap-2"
                  >
                    {isAdding || isAddPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    {isAdding || isAddPending
                      ? "Adding..."
                      : !isActorReady
                        ? "Connecting..."
                        : "Add to Records"}
                  </Button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          aria-labelledby="records-heading"
        >
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2
                  id="records-heading"
                  className="font-semibold text-foreground text-lg"
                >
                  Student Records
                </h2>
                {results.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {results.length}{" "}
                    {results.length === 1 ? "entry" : "entries"}
                  </span>
                )}
              </div>
            </div>

            {resultsLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Loading records...
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-foreground/70 font-medium">No records yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Enter student details above and click "Add to Records"
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto table-scroll">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 whitespace-nowrap">
                        Roll No
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 whitespace-nowrap">
                        Name
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Maths
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Science
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        English
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Tamil
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        CS
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Total
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Avg %
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Grade
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider text-foreground/70 text-center whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {results.map((result, idx) => (
                        <motion.tr
                          key={result.id.toString()}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className="result-row border-b border-border/50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm font-medium text-foreground whitespace-nowrap">
                            {result.rollNumber}
                          </TableCell>
                          <TableCell className="font-medium text-foreground whitespace-nowrap">
                            {result.studentName}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums font-medium text-foreground">
                            {Number(result.maths)}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums font-medium text-foreground">
                            {Number(result.science)}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums font-medium text-foreground">
                            {Number(result.english)}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums font-medium text-foreground">
                            {Number(result.tamil)}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums font-medium text-foreground">
                            {Number(result.computerScience)}
                          </TableCell>
                          <TableCell className="text-center text-sm font-semibold tabular-nums">
                            {Number(result.total)}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums">
                            {result.average.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <GradeBadge grade={result.grade} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(result.id)}
                              disabled={deleteResultMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              aria-label={`Delete ${result.studentName}'s record`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-4">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Student Result Management System</span>
          </div>
          <span>
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-destructive">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
