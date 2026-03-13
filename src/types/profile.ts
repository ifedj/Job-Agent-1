// Structured CV and preferences (stored as JSON in Profile)

export interface StructuredCv {
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    years?: number;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  location?: string;
  summary?: string;
}

export interface ProfilePreferences {
  location?: string;
  locations?: string[];
  country?: string; // Adzuna country code, e.g. "us" or "gb"
  salaryMin?: number;
  salaryMax?: number;
  roleTypes?: string[];
  industries?: string[];
  companyTypes?: string[];
  targetRole?: string;
  yearsOfExperience?: string;
  dreamCompanies?: string[];
  maxJobAgeDays?: number; // default 30
  matchMinScore?: number; // minimum score to show a role (default 75)
  matchMinScoreTop?: number; // score threshold for "top match" e.g. 90 (default 90)
}
