export interface NormalisedJob {
  externalId: string;
  source: string;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  salaryRaw: string | null;
  postedAt: Date | null;
}
