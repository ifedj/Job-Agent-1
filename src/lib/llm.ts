import OpenAI from "openai";
import type { StructuredCv } from "@/types/profile";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateTailoredCv(
  profileCv: StructuredCv,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string
): Promise<string> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const skills = profileCv.skills?.join(", ") ?? "";
  const experience = profileCv.experience
    ?.map((e) => `${e.role} at ${e.company}`)
    .join("; ") ?? "";
  const summary = profileCv.summary ?? "";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a CV writer. Output only the tailored CV text (plain text or markdown), no preamble. Emphasise skills and experience relevant to the job. Keep it concise.",
      },
      {
        role: "user",
        content: `Job: ${jobTitle} at ${jobCompany}.\nJob description (excerpt): ${jobDescription.slice(0, 2000)}\n\nCandidate skills: ${skills}\nExperience: ${experience}\nSummary: ${summary.slice(0, 1500)}\n\nWrite a short tailored CV section (experience + skills) for this role.`,
      },
    ],
    max_tokens: 1500,
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";
  return text || "No content generated.";
}

export async function generateCoverLetter(
  profileCv: StructuredCv,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string
): Promise<string> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const skills = profileCv.skills?.join(", ") ?? "";
  const experience = profileCv.experience
    ?.map((e) => `${e.role} at ${e.company}`)
    .join("; ") ?? "";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a cover letter writer. Output only the cover letter body (2–3 short paragraphs), no subject or greeting. Professional and specific to the role.",
      },
      {
        role: "user",
        content: `Role: ${jobTitle} at ${jobCompany}.\nJob description (excerpt): ${jobDescription.slice(0, 2000)}\n\nCandidate skills: ${skills}\nRelevant experience: ${experience}\n\nWrite a concise cover letter.`,
      },
    ],
    max_tokens: 800,
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";
  return text || "No content generated.";
}

export async function generateOutreachEmail(
  jobTitle: string,
  jobCompany: string,
  contactName: string
): Promise<{ subject: string; body: string }> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write short, professional cold outreach emails. Output only the email: first line as subject (no 'Subject:' label), then a blank line, then the body (2-3 sentences). Ask for a brief chat about the role. No generic fluff.",
      },
      {
        role: "user",
        content: `Role: ${jobTitle} at ${jobCompany}. Recipient: ${contactName}. Write a brief outreach email asking for a chat about the role.`,
      },
    ],
    max_tokens: 300,
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const [first, ...rest] = text.split("\n");
  const subject = first?.replace(/^subject:\s*/i, "").trim() ?? "Quick chat about the role";
  const body = rest.join("\n").trim() || "I would welcome a brief chat about this role.";
  return { subject, body };
}
