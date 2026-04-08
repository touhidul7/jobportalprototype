import { useEffect, useMemo, useState } from "react";
import {
  createJob,
  createStudent,
  getDashboardData,
  getJobs,
  getStudents,
} from "./services/portalApi";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "submit-student", label: "Student Submission" },
  { id: "assessment", label: "Job Assessment" },
  // { id: "jobs", label: "Job Posting" },
  // { id: "students", label: "All Students" },
  { id: "process", label: "Process" },
  { id: "student-reg", label: "Register Student" },
];

const notes = [
  ["Job Portal Site", "Like BDJobs", "A central place for openings and applications."],
  [
    "Technical Education",
    "Student readiness",
    "Students can show interest in technical education to improve employability.",
  ],
  [
    "Job Interest",
    "Career intention",
    "Students can show whether they want to work right now.",
  ],
];

const processSteps = [
  ["01", "Job Assessment", "Officer", "An officer submits the job information."],
  ["02", "Data Collection", "IT Cell", "The IT Cell gathers student data for employers."],
  ["03", "Hiring Support", "Company Partner", "The company helps other companies hire the right people."],
];

const initialJobForm = {
  title: "",
  company: "",
  category: "Software",
  location: "",
  type: "Full-time",
  deadline: "",
  description: "",
};

const initialStudentForm = {
  name: "",
  email: "",
  education: "",
  department: "",
  interestedInWork: true,
  interestedInTechEducation: true,
};

function Badge({ active, children }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-pine text-white" : "bg-white/80 text-ink ring-1 ring-ink/10"
      }`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-coral">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/70">{description}</p>
    </div>
  );
}

function Field({ label, as = "input", children, ...props }) {
  const Comp = as;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink/75">{label}</span>
      <Comp
        className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/10"
        {...props}
      >
        {children}
      </Comp>
    </label>
  );
}

export default function PortalApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [filters, setFilters] = useState({ search: "", work: "all", training: "all" });
  const [notice, setNotice] = useState("");
  const [savingJob, setSavingJob] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [assessmentForm, setAssessmentForm] = useState({
    studentId: "",
    jobTitle: "",
    fitScore: "5",
    notes: "",
    recommendation: "Consider",
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [dashboardData, jobList, studentList] = await Promise.all([
      getDashboardData(),
      getJobs(),
      getStudents(),
    ]);
    setDashboard(dashboardData);
    setJobs(jobList);
    setStudents(studentList);
  }

  async function handleJobSubmit(event) {
    event.preventDefault();
    setSavingJob(true);

    try {
      await createJob(jobForm);
      setJobForm(initialJobForm);
      setNotice("New job posted successfully.");
      await loadAll();
    } finally {
      setSavingJob(false);
    }
  }

  async function handleStudentSubmit(event) {
    event.preventDefault();
    setSavingStudent(true);

    try {
      const newStudent = await createStudent(studentForm);
      setStudentForm(initialStudentForm);
      setNotice("Student registered successfully.");
      if (newStudent) {
        setStudents((current) => [newStudent, ...current]);
      }
      await loadAll();
    } finally {
      setSavingStudent(false);
    }
  }

  async function handleAssessmentSubmit(event) {
    event.preventDefault();
    const student = students.find((s) => s.id === parseInt(assessmentForm.studentId));
    if (!student) {
      setNotice("Please select a valid student.");
      return;
    }

    const newAssessment = {
      id: Date.now(),
      studentName: student.name,
      studentEmail: student.email,
      studentEducation: student.education,
      studentDepartment: student.department,
      studentWork: student.interestedInWork,
      studentTraining: student.interestedInTechEducation,
      jobTitle: assessmentForm.jobTitle,
      fitScore: assessmentForm.fitScore,
      notes: assessmentForm.notes,
      recommendation: assessmentForm.recommendation,
      assessedDate: new Date().toLocaleDateString(),
    };

    setAssessments([newAssessment, ...assessments]);
    setAssessmentForm({
      studentId: "",
      jobTitle: "",
      fitScore: "5",
      notes: "",
      recommendation: "Consider",
    });
    setNotice("Assessment created successfully.");
  }

  function downloadAssessmentsCSV() {
    if (assessments.length === 0) {
      setNotice("No assessments to download.");
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Education",
      "Department",
      "Interested in Work",
      "Interested in Training",
      "Job Title Assessed",
      "Fit Score (1-10)",
      "Notes",
      "Recommendation",
      "Date Assessed",
    ];

    const rows = assessments.map((a) => [
      a.studentName,
      a.studentEmail,
      a.studentEducation,
      a.studentDepartment,
      a.studentWork ? "Yes" : "No",
      a.studentTraining ? "Yes" : "No",
      a.jobTitle,
      a.fitScore,
      a.notes,
      a.recommendation,
      a.assessedDate,
    ]);

    const csvContent =
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_assessments_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          student.name.toLowerCase().includes(search) ||
          student.education.toLowerCase().includes(search) ||
          student.department.toLowerCase().includes(search);
        const matchesWork =
          filters.work === "all" || String(student.interestedInWork) === filters.work;
        const matchesTraining =
          filters.training === "all" ||
          String(student.interestedInTechEducation) === filters.training;

        return matchesSearch && matchesWork && matchesTraining;
      }),
    [filters, students],
  );

  const stats = dashboard
    ? [
        ["Student Profiles", dashboard.totalStudents],
        ["Partner Companies", dashboard.totalCompanies],
        ["Open Jobs", dashboard.totalJobs],
        ["Ready For Referral", dashboard.readyStudents],
      ]
    : [];

  return (
    <div className="min-h-screen bg-sand font-body text-ink">
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:32px_32px] opacity-50" />
      <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-pine">CareerBridge</p>
            <p className="text-sm text-ink/60">Student Job Portal Platform</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activePage === item.id
                    ? "bg-pine text-white"
                    : "bg-white text-ink/70 ring-1 ring-ink/10 hover:text-pine"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-10">
        <section className="grid gap-8 overflow-hidden rounded-[2rem] bg-cream px-6 py-10 shadow-float ring-1 ring-ink/5 md:grid-cols-[1.15fr_0.85fr] md:px-10 md:py-14">
          <div>
            <Badge active>Portal + Forms + API Layer</Badge>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
              A complete frontend for job posting, student registration, and hiring coordination.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
              Jobs, students, and dashboard stats now load from a reusable service layer and update live when forms are submitted.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
                  <p className="text-3xl font-bold text-pine">{value}</p>
                  <p className="mt-2 text-sm text-ink/65">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-ink p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky">Portal Overview</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Primary Users</p>
                <p className="mt-2 text-xl font-semibold">Students, Officers, IT Cell, Company Partners</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Current Page</p>
                <p className="mt-2 text-xl font-semibold capitalize">{activePage}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Backend Style</p>
                <p className="mt-2 text-xl font-semibold">Mock API with local persistence, easy to replace with a real server later.</p>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-pine/10 bg-pine/10 px-5 py-4 text-sm font-semibold text-pine">
            {notice}
          </div>
        ) : null}

        {activePage === "dashboard" ? (
          <section className="mt-20 grid gap-8 lg:grid-cols-2">
            <div className="grid gap-5">
              <SectionTitle
                eyebrow="Software Notes"
                title="The portal explains what students want and where they fit."
                description="Your original notes are still present, now inside a fuller application layout."
              />
              {notes.map(([title, subtitle, description], index) => (
                <article
                  key={title}
                  className="rounded-[1.75rem] bg-white p-6 shadow-float ring-1 ring-ink/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold text-ink">{title}</h3>
                    <Badge active={index === 0}>{subtitle}</Badge>
                  </div>
                  <p className="mt-4 text-base leading-7 text-ink/70">{description}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-6 self-end">
              <div className="rounded-[1.75rem] bg-white p-6 shadow-float ring-1 ring-ink/5">
                <h3 className="font-display text-2xl font-bold text-ink">Recent Jobs</h3>
                <div className="mt-6 space-y-4">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="rounded-2xl border border-ink/8 px-4 py-4">
                      <p className="font-semibold text-ink">{job.title}</p>
                      <p className="text-sm text-ink/60">
                        {job.company} · {job.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-6 shadow-float ring-1 ring-ink/5">
                <h3 className="font-display text-2xl font-bold text-ink">Interest Snapshot</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm text-ink/60">Interested in Work</p>
                    <p className="mt-2 text-2xl font-bold text-pine">
                      {students.filter((item) => item.interestedInWork).length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm text-ink/60">Interested in Technical Education</p>
                    <p className="mt-2 text-2xl font-bold text-pine">
                      {students.filter((item) => item.interestedInTechEducation).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activePage === "jobs" ? (
          <section className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="Job Posting"
                title="Post new jobs for review and company sharing."
                description="Officer submissions save into the API layer and refresh the live job list."
              />
              <form className="mt-8 grid gap-5" onSubmit={handleJobSubmit}>
                <Field
                  label="Job Title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="Frontend Developer"
                  required
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Company Name"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="TechNova Ltd."
                    required
                  />
                  <Field
                    label="Location"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="Dhaka"
                    required
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <Field
                    as="select"
                    label="Category"
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                  >
                    <option>Software</option>
                    <option>Networking</option>
                    <option>Electrical</option>
                    <option>Textile</option>
                    <option>Support</option>
                  </Field>
                  <Field
                    as="select"
                    label="Job Type"
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                  >
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                    <option>Part-time</option>
                  </Field>
                  <Field
                    label="Deadline"
                    type="date"
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                    required
                  />
                </div>
                <Field
                  as="textarea"
                  label="Job Description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe the role and skills required."
                  required
                />
                <button
                  type="submit"
                  disabled={savingJob}
                  className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:opacity-70"
                >
                  {savingJob ? "Posting..." : "Post Job"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="Live Jobs"
                title="Current openings in the portal."
                description="These cards update instantly after each submission."
              />
              <div className="mt-8 grid gap-4">
                {jobs.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-ink/20 bg-sand/60 p-10 text-center">
                    <p className="text-lg font-semibold text-ink">No job postings yet.</p>
                    <p className="mt-2 text-sm text-ink/70">
                      Use the form on the left to create a job posting, and it will appear here.
                    </p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <article
                      key={job.id}
                      className="rounded-[1.5rem] border border-ink/8 bg-sand/50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-2xl font-bold text-ink">{job.title}</h3>
                          <p className="mt-2 text-sm text-ink/65">
                            {job.company} · {job.location} · {job.category}
                          </p>
                        </div>
                        <Badge active>{job.type}</Badge>
                      </div>
                      <p className="mt-4 leading-7 text-ink/70">{job.description}</p>
                      <p className="mt-4 text-sm font-semibold text-pine">Deadline: {job.deadline}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === "submit-student" ? (
          <section className="mt-20 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="Student Submission"
                title="Submit your information for job opportunities."
                description="Fill in your details and interests so recruiters and officers can match you with suitable job roles."
              />
              <form className="mt-8 grid gap-5" onSubmit={handleStudentSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Full Name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                  <Field
                    label="Email Address"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Education/Qualification"
                    value={studentForm.education}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, education: e.target.value })
                    }
                    placeholder="e.g., Diploma in Computer Technology"
                    required
                  />
                  <Field
                    label="Department/Stream"
                    value={studentForm.department}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, department: e.target.value })
                    }
                    placeholder="e.g., Computer, Electrical, Textile"
                    required
                  />
                </div>

                <div className="rounded-[1.5rem] bg-gradient-to-br from-coral/10 to-pine/10 p-6">
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-coral">
                    Your Interests
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 transition hover:border-pine">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-ink">Want to work now?</span>
                        <span className="text-xs text-ink/50">Show interest in job opportunities</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={studentForm.interestedInWork}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            interestedInWork: e.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-pine"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 transition hover:border-pine">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-ink">Training interest?</span>
                        <span className="text-xs text-ink/50">Interested in technical education</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={studentForm.interestedInTechEducation}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            interestedInTechEducation: e.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-pine"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingStudent}
                  className="mt-4 rounded-2xl bg-gradient-to-r from-pine to-pine/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-70"
                >
                  {savingStudent ? "Submitting..." : "Submit Your Information"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="Submitted Students"
                title="Students who have submitted their information."
                description="View all student submissions from this portal."
              />
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ink/10">
                {students.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-ink/60">No student submissions yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 bg-ink px-5 py-4 text-sm font-semibold text-white md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr]">
                      <p>Name</p>
                      <p>Education</p>
                      <p>Work Interest</p>
                      <p>Training Interest</p>
                    </div>
                    {students.map((student, index) => (
                      <div
                        key={student.id}
                        className={`grid grid-cols-1 gap-2 px-5 py-4 text-sm md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] ${
                          index % 2 === 0 ? "bg-sand/60" : "bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-ink">{student.name}</p>
                          <p className="text-xs text-ink/50">{student.email}</p>
                        </div>
                        <p className="text-ink/70">{student.education}</p>
                        <p>
                          <Badge active={student.interestedInWork}>
                            {student.interestedInWork ? "✓ Yes" : "✗ No"}
                          </Badge>
                        </p>
                        <p>
                          <Badge active={student.interestedInTechEducation}>
                            {student.interestedInTechEducation ? "✓ Yes" : "✗ No"}
                          </Badge>
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === "assessment" ? (
          <section className="mt-20 grid gap-8 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8 lg:col-span-1">
              <SectionTitle
                eyebrow="Job Assessment"
                title="Create assessments for students."
                description="Officers use this to match students with jobs and record their fit assessment."
              />
              <form className="mt-8 grid gap-5" onSubmit={handleAssessmentSubmit}>
                <Field
                  as="select"
                  label="Select Student"
                  value={assessmentForm.studentId}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, studentId: e.target.value })
                  }
                  required
                >
                  <option value="">-- Choose a student --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.department})
                    </option>
                  ))}
                </Field>

                <Field
                  label="Job Title"
                  value={assessmentForm.jobTitle}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, jobTitle: e.target.value })
                  }
                  placeholder="e.g., Junior Frontend Developer"
                  required
                />

                <Field
                  as="select"
                  label="Fit Score (1-10)"
                  value={assessmentForm.fitScore}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, fitScore: e.target.value })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} - {num <= 3 ? "Poor" : num <= 6 ? "Average" : "Excellent"}
                    </option>
                  ))}
                </Field>

                <Field
                  as="select"
                  label="Recommendation"
                  value={assessmentForm.recommendation}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, recommendation: e.target.value })
                  }
                >
                  <option>Consider</option>
                  <option>Strong Match</option>
                  <option>Needs Training</option>
                  <option>Not Recommended</option>
                </Field>

                <Field
                  as="textarea"
                  label="Assessment Notes"
                  value={assessmentForm.notes}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, notes: e.target.value })
                  }
                  placeholder="Add notes about this assessment..."
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-pine/90"
                >
                  Save Assessment
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8 lg:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SectionTitle
                  eyebrow="Assessment Results"
                  title="All job assessments on record."
                  description="View and download student assessment reports."
                />
                <button
                  onClick={downloadAssessmentsCSV}
                  className="rounded-2xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90"
                >
                  📥 Download CSV
                </button>
              </div>

              <div className="mt-8 grid gap-4">
                {assessments.length === 0 ? (
                  <div className="rounded-[1.5rem] border-2 border-dashed border-ink/20 px-6 py-12 text-center">
                    <p className="text-sm text-ink/60">
                      No assessments yet. Create one to get started.
                    </p>
                  </div>
                ) : (
                  assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="rounded-[1.5rem] border border-ink/8 bg-gradient-to-br from-sand/50 to-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-bold text-ink">
                            {assessment.studentName}
                          </h3>
                          <p className="text-xs text-ink/50">{assessment.studentEmail}</p>
                          <p className="mt-1 text-sm text-ink/70">
                            {assessment.studentEducation} • {assessment.studentDepartment}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-ink/50">Job: {assessment.jobTitle}</p>
                          <p className="mt-1 text-2xl font-bold text-pine">{assessment.fitScore}/10</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 rounded-xl bg-white p-3 md:grid-cols-3">
                        <div className="text-xs">
                          <p className="text-ink/50">Work Interest</p>
                          <p className="font-semibold text-ink">
                            {assessment.studentWork ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                        <div className="text-xs">
                          <p className="text-ink/50">Training Interest</p>
                          <p className="font-semibold text-ink">
                            {assessment.studentTraining ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                        <div className="text-xs">
                          <p className="text-ink/50">Assessed</p>
                          <p className="font-semibold text-ink">{assessment.assessedDate}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge active={assessment.recommendation === "Strong Match"}>
                          {assessment.recommendation}
                        </Badge>
                        {assessment.notes && (
                          <p className="text-xs text-ink/60 italic">"{assessment.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === "student-reg" ? (
          <section className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="Student Registration"
                title="Register students and record their job or training interest."
                description="This form updates the student list through the same service layer."
              />
              <form className="mt-8 grid gap-5" onSubmit={handleStudentSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Student Name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="Ayesha Sultana"
                    required
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="student@email.com"
                    required
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Education"
                    value={studentForm.education}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, education: e.target.value })
                    }
                    placeholder="Diploma in Computer Technology"
                    required
                  />
                  <Field
                    label="Department"
                    value={studentForm.department}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, department: e.target.value })
                    }
                    placeholder="Computer"
                    required
                  />
                </div>
                <div className="grid gap-4 rounded-[1.5rem] bg-sand p-5 md:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm font-semibold text-ink/75">Interested in working</span>
                    <input
                      type="checkbox"
                      checked={studentForm.interestedInWork}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          interestedInWork: e.target.checked,
                        })
                      }
                      className="h-5 w-5 accent-pine"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                    <span className="text-sm font-semibold text-ink/75">
                      Interested in technical education
                    </span>
                    <input
                      type="checkbox"
                      checked={studentForm.interestedInTechEducation}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          interestedInTechEducation: e.target.checked,
                        })
                      }
                      className="h-5 w-5 accent-pine"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:opacity-70"
                >
                  {savingStudent ? "Registering..." : "Register Student"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-float ring-1 ring-ink/5 md:p-8">
              <SectionTitle
                eyebrow="All Students"
                title="Search and view all registered students."
                description="Use the filters below to find students by education, department, job interest, or technical training interest."
              />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Field
                  label="Search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search name or department"
                />
                <Field
                  as="select"
                  label="Job Interest"
                  value={filters.work}
                  onChange={(e) => setFilters({ ...filters, work: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="true">Interested</option>
                  <option value="false">Not now</option>
                </Field>
                <Field
                  as="select"
                  label="Tech Education"
                  value={filters.training}
                  onChange={(e) => setFilters({ ...filters, training: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="true">Interested</option>
                  <option value="false">No</option>
                </Field>
              </div>

              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ink/10">
                {filteredStudents.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-ink/60">
                      {students.length === 0 ? "No students registered yet." : "No students match your filters."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 bg-ink px-5 py-4 text-sm font-semibold text-white md:grid-cols-[1.1fr_1fr_0.9fr_0.8fr_0.8fr]">
                      <p>Name</p>
                      <p>Education</p>
                      <p>Department</p>
                      <p>Work</p>
                      <p>Training</p>
                    </div>
                    {filteredStudents.map((student, index) => (
                      <div
                        key={student.id}
                        className={`grid grid-cols-1 gap-2 px-5 py-4 text-sm md:grid-cols-[1.1fr_1fr_0.9fr_0.8fr_0.8fr] ${
                          index % 2 === 0 ? "bg-sand/60" : "bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-ink">{student.name}</p>
                          <p className="text-xs text-ink/50">{student.email}</p>
                        </div>
                        <p className="text-ink/70">{student.education}</p>
                        <p className="text-ink/70">{student.department}</p>
                        <p>
                          <Badge active={student.interestedInWork}>
                            {student.interestedInWork ? "Interested" : "Not now"}
                          </Badge>
                        </p>
                        <p>
                          <Badge active={student.interestedInTechEducation}>
                            {student.interestedInTechEducation ? "Interested" : "No"}
                          </Badge>
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === "process" ? (
          <section className="mt-20">
            <SectionTitle
              eyebrow="Student Process"
              title="A clear workflow from job submission to company hiring support."
              description="This section keeps your original process and places it inside the larger product flow."
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {processSteps.map(([step, title, owner, description]) => (
                <article
                  key={step}
                  className="rounded-[1.75rem] bg-pine p-6 text-white shadow-float transition hover:-translate-y-1"
                >
                  <p className="text-sm font-bold tracking-[0.3em] text-sky">STEP {step}</p>
                  <h3 className="mt-4 font-display text-2xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/65">
                    {owner}
                  </p>
                  <p className="mt-6 leading-7 text-white/80">{description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
