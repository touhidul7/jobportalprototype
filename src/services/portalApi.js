import { supabase } from "./supabaseClient";

const STORAGE_KEYS = {
  jobs: "careerbridge_jobs",
  students: "careerbridge_students",
};

const defaultJobs = [
  {
    id: 1,
    title: "Junior Frontend Developer",
    company: "TechNova Ltd.",
    category: "Software",
    location: "Dhaka",
    type: "Full-time",
    deadline: "2026-04-30",
    description:
      "Work with the UI team to build responsive portal features and maintain student-facing dashboards.",
  },
  {
    id: 2,
    title: "IT Support Trainee",
    company: "Future Systems",
    category: "Support",
    location: "Chattogram",
    type: "Internship",
    deadline: "2026-05-12",
    description:
      "Support internal systems, assist deployment teams, and learn technical operations for enterprise environments.",
  },
];

const defaultStudents = [
  {
    id: 1,
    name: "Rahim Uddin",
    email: "rahim@example.com",
    education: "Diploma in Computer Technology",
    department: "Computer",
    interestedInWork: true,
    interestedInTechEducation: true,
  },
  {
    id: 2,
    name: "Nusrat Jahan",
    email: "nusrat@example.com",
    education: "Textile Technology",
    department: "Textile",
    interestedInWork: true,
    interestedInTechEducation: false,
  },
  {
    id: 3,
    name: "Sabbir Hossain",
    email: "sabbir@example.com",
    education: "Electrical Technology",
    department: "Electrical",
    interestedInWork: false,
    interestedInTechEducation: true,
  },
];

const useSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function wait(duration = 250) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function parseBoolean(value) {
  return value === true || value === "true";
}

function mapStudentFromDb(student) {
  if (!student) return student;
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    education: student.education,
    department: student.department,
    interestedInWork: student.interestedinwork ?? student.interested_in_work ?? false,
    interestedInTechEducation:
      student.interestedintecheducation ?? student.interested_in_tech_education ?? false,
    created_at: student.created_at,
  };
}

function mapStudentToDb(student) {
  return {
    name: student.name,
    email: student.email,
    education: student.education,
    department: student.department,
    interestedinwork: parseBoolean(student.interestedInWork),
    interestedintecheducation: parseBoolean(student.interestedInTechEducation),
  };
}

function readCollection(key, fallback) {
  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  return JSON.parse(storedValue);
}

function writeCollection(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function withFallback(action, fallback) {
  try {
    return await action();
  } catch (error) {
    console.error(error);
    return fallback();
  }
}

export async function getJobs() {
  if (useSupabase) {
    return withFallback(async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      return data;
    }, () => readCollection(STORAGE_KEYS.jobs, defaultJobs));
  }

  await wait();
  return readCollection(STORAGE_KEYS.jobs, defaultJobs);
}

export async function getStudents() {
  if (useSupabase) {
    return withFallback(async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      return data.map(mapStudentFromDb) || [];
    }, () => readCollection(STORAGE_KEYS.students, defaultStudents));
  }

  await wait();
  return readCollection(STORAGE_KEYS.students, defaultStudents);
}

export async function createJob(payload) {
  if (useSupabase) {
    return withFallback(async () => {
      const { data, error } = await supabase.from("jobs").insert([payload]).select();
      if (error) throw error;
      return data?.[0] ?? null;
    }, async () => {
      await wait();
      const jobs = readCollection(STORAGE_KEYS.jobs, defaultJobs);
      const nextJob = { id: Date.now(), ...payload };
      writeCollection(STORAGE_KEYS.jobs, [nextJob, ...jobs]);
      return nextJob;
    });
  }

  await wait();
  const jobs = readCollection(STORAGE_KEYS.jobs, defaultJobs);
  const nextJob = { id: Date.now(), ...payload };
  writeCollection(STORAGE_KEYS.jobs, [nextJob, ...jobs]);
  return nextJob;
}

export async function createStudent(payload) {
  const studentData = {
    ...payload,
    interestedInWork: parseBoolean(payload.interestedInWork),
    interestedInTechEducation: parseBoolean(payload.interestedInTechEducation),
  };

  if (useSupabase) {
    return withFallback(async () => {
      const dbRow = mapStudentToDb(studentData);
      const { data, error } = await supabase.from("students").insert([dbRow]).select();
      if (error) throw error;
      return mapStudentFromDb(data?.[0] ?? null);
    }, async () => {
      await wait();
      const students = readCollection(STORAGE_KEYS.students, defaultStudents);
      const nextStudent = { id: Date.now(), ...studentData };
      writeCollection(STORAGE_KEYS.students, [nextStudent, ...students]);
      return nextStudent;
    });
  }

  await wait();
  const students = readCollection(STORAGE_KEYS.students, defaultStudents);
  const nextStudent = { id: Date.now(), ...studentData };
  writeCollection(STORAGE_KEYS.students, [nextStudent, ...students]);
  return nextStudent;
}

export async function getDashboardData() {
  const [jobs, students] = await Promise.all([getJobs(), getStudents()]);
  const companies = new Set(jobs.map((job) => job.company));

  return {
    totalJobs: jobs.length,
    totalStudents: students.length,
    totalCompanies: companies.size,
    readyStudents: students.filter((student) => student.interestedInWork).length,
  };
}
