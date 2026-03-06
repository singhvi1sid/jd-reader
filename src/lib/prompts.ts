export const JD_ANALYSIS_PROMPT = `You are an expert HR analyst and technical recruiter with deep knowledge across all industries — tech, marketing, finance, healthcare, operations, design, data, sales, and more. Analyze the following job description and extract structured information.

Return a JSON object with EXACTLY this structure:
{
  "jobTitle": "string - the exact job title",
  "companyName": "string - the company/organization name if mentioned, otherwise empty string",
  "seniority": "string - one of: junior, mid, senior, lead",
  "domain": "string - the primary domain (e.g., Backend Engineering, Performance Marketing, Data Analytics, Product Management, UI/UX Design, Financial Analysis, Sales, HR, DevOps, etc.)",
  "skills": ["array of required/must-have skills - be VERY specific, include tools, platforms, metrics, methodologies"],
  "niceToHaveSkills": ["array of nice-to-have/preferred skills"],
  "keyResponsibilities": ["array of 3-6 core day-to-day responsibilities extracted from the JD"]
}

Rules:
- If seniority is not explicitly stated, infer it from context (years of experience, responsibilities, etc.)
- Extract SPECIFIC technologies, platforms, tools, frameworks, metrics, and methodologies as skills
  - For marketing roles: extract things like "Google Ads", "Meta Ads Manager", "ROAS optimization", "A/B testing", "CPA management", "funnel analysis"
  - For data roles: extract things like "SQL", "Python", "Tableau", "cohort analysis", "statistical modeling"
  - For engineering roles: extract things like "React", "Node.js", "PostgreSQL", "CI/CD", "microservices"
  - For business roles: extract things like "financial modeling", "P&L management", "stakeholder management"
- Separate must-have from nice-to-have skills
- Domain should be a concise, specific category
- Key responsibilities should capture what the person actually DOES day-to-day, not vague descriptions

Job Description:
`;

export function getAssessmentPrompt(
  analysis: {
    jobTitle: string;
    seniority: string;
    domain: string;
    skills: string[];
    niceToHaveSkills: string[];
    keyResponsibilities: string[];
  },
  reusableContext?: {
    questions: Array<{
      type: string;
      content: string;
      options?: string[];
      expectedAnswer?: string;
      difficulty: string;
      skillTested: string;
      action: "reuse_as_is" | "modify";
      modificationNote: string;
    }>;
  }
) {
  const reusableSection = reusableContext && reusableContext.questions.length > 0
    ? `
=== REUSABLE QUESTIONS FROM SIMILAR PAST ASSESSMENT ===
The following questions are from a similar previous assessment. Incorporate them as instructed:
${reusableContext.questions.map((q, i) => `
${i + 1}. [${q.action.toUpperCase()}] (${q.type}, ${q.difficulty}, skill: ${q.skillTested})
${q.content}
${q.options ? `Options: ${q.options.join(" | ")}` : ""}
${q.expectedAnswer ? `Expected: ${q.expectedAnswer}` : ""}
${q.action === "modify" ? `Modification needed: ${q.modificationNote}` : "Use this question as-is."}
`).join("")}

IMPORTANT: Include these reusable questions (with modifications where noted) and generate additional NEW questions to reach the target count for each type. Do NOT duplicate topics already covered by reused questions.
`
    : "";

  return `You are an elite assessment designer who creates hyper-specific, role-relevant evaluations. You NEVER create generic questions. Every question must feel like it was written by someone who actually works in this exact role.

Role Analysis:
- Job Title: ${analysis.jobTitle}
- Seniority Level: ${analysis.seniority}
- Domain: ${analysis.domain}
- Required Skills: ${analysis.skills.join(", ")}
- Nice-to-Have Skills: ${analysis.niceToHaveSkills.join(", ")}
- Key Responsibilities: ${analysis.keyResponsibilities.join("; ")}

Generate an assessment with the following question types. Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "type": "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK",
      "content": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "expectedAnswer": "Brief expected answer or correct option",
      "difficulty": "easy" | "medium" | "hard",
      "skillTested": "The specific skill this tests",
      "order": 1
    }
  ]
}

=== QUESTION TYPE GUIDELINES ===

1. MCQ Questions (5-8): Test domain-specific terminology, concepts, and tool knowledge.
   - Each must have exactly 4 options.
   - The expectedAnswer should be the correct option text.
   - These should test things a person in THIS role must know cold.
   
   DOMAIN-SPECIFIC MCQ EXAMPLES:
   - Marketing: "What does ROAS stand for?", "Which metric best indicates top-of-funnel performance?", "In Google Ads, what does Quality Score directly affect?"
   - Engineering: "What is the time complexity of a hash table lookup?", "Which HTTP status code indicates a resource was created?"
   - Data/Analytics: "Which SQL clause is used to filter grouped results?", "What does a p-value of 0.03 indicate?"
   - Finance: "What does EBITDA stand for?", "Which ratio measures a company's ability to pay short-term obligations?"
   - Sales: "What does MQL stand for in a sales pipeline?", "At which stage is a prospect considered 'qualified'?"

2. SHORT_ANSWER Questions (3-5): Test practical understanding with domain-specific depth. No options field.
   - Ask questions that reveal whether someone has ACTUALLY done this work, not just read about it.
   
   DOMAIN-SPECIFIC SHORT ANSWER EXAMPLES:
   - Marketing: "Explain the difference between ROAS and ROI. When would you optimize for each?"
   - Engineering: "Explain when you'd choose a NoSQL database over a relational one. Give a concrete example."
   - Data: "What's the difference between correlation and causation? Give a business example where confusing them would lead to a bad decision."
   - Product: "How would you prioritize features when you have 10 requests but capacity for 3?"

3. SCENARIO Questions (2-3): Present realistic, messy, real-world situations with SPECIFIC numbers and context. No options field.
   - Include actual metrics, data points, or business context.
   - For data/analytics roles: Include data tables or datasets in the question using markdown table format.
   - For marketing roles: Include campaign metrics, budget numbers, and platform-specific details.
   - For engineering roles: Include system constraints, traffic numbers, or architecture details.
   
   DOMAIN-SPECIFIC SCENARIO EXAMPLES:
   - Performance Marketing: "Your Meta Ads CPA doubled from $12 to $24 over the last month while spend remained constant at $10K/month. CTR dropped from 2.1% to 1.4%, but CPM stayed flat. List 3 possible root causes and what you'd investigate first."
   - Data Analyst: "You're given this table of monthly user data:
     | Month | Signups | Active Users | Churn Rate |
     | Jan   | 1,200   | 8,500        | 4.2%       |
     | Feb   | 1,450   | 8,900        | 4.8%       |
     | Mar   | 980     | 8,200        | 5.5%       |
     What trends do you see? What would you investigate further and what would you recommend to leadership?"
   - Backend Engineer: "Your API's p99 latency spiked from 200ms to 2.3s after a deployment. The service handles 5K RPM. Database CPU is at 85%. What's your debugging approach?"
   - Product Manager: "Feature A will increase revenue by $50K/month but takes 3 months to build. Feature B will reduce churn by 2% (current MRR: $500K) but takes 1 month. Which do you prioritize and why?"

4. MINI_TASK Questions (1-2): Hands-on exercises that simulate actual day-to-day work. No options field.
   - These should be completable in 10-15 minutes and mirror real tasks from the key responsibilities.
   
   DOMAIN-SPECIFIC MINI TASK EXAMPLES:
   - Marketing: "Draft a brief for a retargeting campaign targeting users who added to cart but didn't purchase. Include: audience definition, platform choice, budget allocation approach, and 3 ad copy variations."
   - Engineering: "Write a function that takes an array of user activity logs and returns the top 3 most active users by total session duration."
   - Data: "Write a SQL query to find the top 5 products by revenue in the last 30 days, along with their month-over-month growth rate."
   - Design: "Sketch a user flow for a password reset process. List every screen/state and edge case."
   - Sales: "Write a cold outreach email to a VP of Marketing at a mid-size e-commerce company, pitching an analytics tool. Keep it under 150 words."

=== DOMAIN-SPECIFIC CREATIVE QUESTIONS ===

**For Software Engineering / Coding Roles** — generate at least 1-2 of these under MINI_TASK or SCENARIO:

- **Coding challenges**: Present a function signature and ask the candidate to write the implementation in their preferred language. Example:
  "Write a function \`rateLimiter(maxRequests, windowMs)\` that returns true if a request should be allowed, false if rate-limited. Explain your approach and time/space complexity."

- **Debugging tasks**: Present a code snippet with intentional bugs and ask the candidate to identify and fix them. Example:
  "The following JavaScript function is supposed to debounce API calls, but it has 3 bugs. Identify each bug and provide the corrected code:
  \`\`\`javascript
  function debounce(fn, delay) {
    let timer;
    return function() {
      clearTimeout(timer);
      fn.apply(this, arguments);
      timer = setTimeout(() => {}, delay);
    }
  }
  \`\`\`"

- **Code review**: Present code and ask for a review with specific improvement suggestions. Example:
  "Review this API endpoint handler. Identify security vulnerabilities, performance issues, and suggest improvements with reasoning."

- **System design**: Ask for a text-based architecture description. Example:
  "Design the backend architecture for a real-time collaborative document editor supporting 10K concurrent users. Describe: key components, data flow, conflict resolution strategy, and technology choices with justifications."

- **Pseudocode / Algorithm**: Ask for algorithmic thinking without requiring syntax-perfect code. Example:
  "Write pseudocode for a function that finds the shortest path in a weighted graph with negative edges. Explain why standard Dijkstra's wouldn't work here."

- **Refactoring**: Present poorly structured code and ask for a refactored version with explanation. Example:
  "This 80-line function handles user registration, validation, email sending, and database insertion all in one block. Refactor it into clean, testable units. Describe your approach and the principles you're applying."

**For UI/UX Design Roles** — generate at least 1-2 of these under MINI_TASK or SCENARIO:

- **Brand analysis**: Give a brand scenario and ask for a written critique. Example:
  "You're evaluating Brand X, a B2B SaaS company targeting enterprise clients. Their current website uses Comic Sans for headers, 7 different colors with no clear hierarchy, and tiny 10px body text. Write a critique covering: typography choices, color palette effectiveness, visual hierarchy, spacing consistency, and provide 5 specific improvement recommendations with reasoning."

- **Design critique / UX audit**: Describe a user interface and ask for an evaluation. Example:
  "A checkout flow has these steps: (1) Cart page with no item count, (2) Shipping form requiring 15 fields on one page, (3) Payment page with no order summary visible, (4) Confirmation page with no email confirmation mention. Identify 5 UX issues, explain the user impact of each, and propose solutions based on established UX principles."

- **Wireframe description**: Ask for a text-based wireframe/layout spec. Example:
  "Describe a wireframe for a mobile banking app's dashboard. Include: layout structure, component hierarchy, information architecture, key interactions, responsive behavior considerations, and accessibility requirements."

- **Design system task**: Ask about component design at a systems level. Example:
  "Define a Button component system for a design library. Specify: all visual states (default, hover, active, disabled, loading), sizes (sm, md, lg), variants (primary, secondary, ghost, destructive), and write the design tokens (colors, spacing, border-radius, typography) for each combination."

- **User flow mapping**: Ask for a comprehensive user journey. Example:
  "Map the complete user flow for a 'forgot password' feature. Include: every screen/state, error states, edge cases (expired links, locked accounts, rate limiting), email content, and accessibility considerations. Present it as a numbered list of steps with branching paths."

- **Portfolio-style task**: Simulate a real design project brief. Example:
  "You're redesigning the onboarding flow for a fitness tracking app. The current onboarding has a 40% drop-off rate at step 3 of 6. Describe: 2 user personas, your proposed simplified flow (max 3 steps), the key screens with component descriptions, micro-interactions, and how you'd measure improvement."

=== CALIBRATION RULES ===
- For "junior": Fundamentals, terminology, standard workflows. Easy-medium difficulty. Questions should verify they understand the basics and can follow established processes.
- For "mid": Applied knowledge, some ambiguity, trade-off discussions. Medium difficulty. Questions should verify they can work independently and make judgment calls.
- For "senior": Strategic thinking, complex trade-offs, cross-functional impact, mentoring. Medium-hard difficulty. Questions should reveal depth of experience and ability to lead.
- For "lead": System-level thinking, organizational strategy, team building, stakeholder management. Hard difficulty. Questions should test vision, leadership, and architectural thinking.

${reusableSection}
=== CRITICAL RULES ===
- Every question MUST be specific to the skills, domain, and responsibilities listed above. NEVER use generic filler questions.
- Use real-world terminology, metrics, tools, and platforms that someone in this exact role would encounter daily.
- For SCENARIO questions: ALWAYS include specific numbers, metrics, or data. Never write vague scenarios.
- For roles involving data: Include markdown tables with realistic data when appropriate.
- Each question's "order" should be sequential starting from 1.
- For MCQ type, always include "options" array with exactly 4 strings.
- For non-MCQ types, do NOT include the "options" field.
- Questions should feel like they came from a hiring manager who does this job, not from a textbook.
`;
}

export function getSimilarityCheckPrompt(params: {
  newRole: {
    jobTitle: string;
    seniority: string;
    domain: string;
    skills: string[];
  };
  existingQuestions: Array<{
    order: number;
    type: string;
    content: string;
    options?: string[];
    expectedAnswer?: string;
    difficulty: string;
    skillTested: string;
  }>;
  existingJobTitle: string;
}) {
  return `You are comparing a new job role with questions from a previous, similar assessment. Determine which questions can be reused, which need modification, and which are irrelevant.

New Role:
- Job Title: ${params.newRole.jobTitle}
- Seniority: ${params.newRole.seniority}
- Domain: ${params.newRole.domain}
- Required Skills: ${params.newRole.skills.join(", ")}

Previous Assessment: "${params.existingJobTitle}"
Questions from that assessment:
${params.existingQuestions.map((q) => `
Q${q.order} (${q.type}, ${q.difficulty}, skill: ${q.skillTested}):
${q.content}
${q.options ? `Options: ${q.options.join(" | ")}` : ""}
${q.expectedAnswer ? `Expected: ${q.expectedAnswer}` : ""}
`).join("\n---\n")}

Return a JSON object:
{
  "reusableQuestions": [
    {
      "originalOrder": <number>,
      "action": "reuse_as_is" | "modify",
      "modificationNote": "What to change (only if action is modify, otherwise empty string)"
    }
  ],
  "similarityScore": <0-100 how similar the roles are>
}

Rules:
- Only mark questions as reusable if they are directly relevant to the NEW role's skills and domain
- If the question tests a skill not in the new role's required skills, skip it
- A question testing a universal concept (e.g., general problem solving) across similar domains can be reused
- If the seniority levels differ significantly, suggest modification to adjust difficulty
- Be conservative: only reuse questions that truly fit the new role
`;
}

export function getRegeneratePrompt(params: {
  jobTitle: string;
  seniority: string;
  domain: string;
  skills: string[];
  originalQuestion: {
    type: string;
    content: string;
    options?: string[];
    expectedAnswer?: string;
    difficulty: string;
    skillTested: string;
  };
  feedback: string;
}) {
  return `You are an elite assessment designer. A recruiter reviewed a question and wants it changed. Regenerate the question based on their feedback.

Role Context:
- Job Title: ${params.jobTitle}
- Seniority: ${params.seniority}
- Domain: ${params.domain}
- Skills: ${params.skills.join(", ")}

Original Question:
- Type: ${params.originalQuestion.type}
- Content: ${params.originalQuestion.content}
${params.originalQuestion.options ? `- Options: ${params.originalQuestion.options.join(" | ")}` : ""}
${params.originalQuestion.expectedAnswer ? `- Expected Answer: ${params.originalQuestion.expectedAnswer}` : ""}
- Difficulty: ${params.originalQuestion.difficulty}
- Skill Tested: ${params.originalQuestion.skillTested}

Recruiter Feedback: "${params.feedback}"

Return a JSON object with this EXACT structure:
{
  "type": "${params.originalQuestion.type}",
  "content": "The new question text",
  ${params.originalQuestion.type === "MCQ" ? '"options": ["Option A", "Option B", "Option C", "Option D"],' : ""}
  "expectedAnswer": "Brief expected answer",
  "difficulty": "easy" | "medium" | "hard",
  "skillTested": "The specific skill this tests"
}

Rules:
- Keep the same question TYPE unless the feedback explicitly asks to change it
- Apply the recruiter's feedback precisely
- Maintain the same quality and domain-specificity standards
${params.originalQuestion.type === "MCQ" ? "- Include exactly 4 options for MCQ type" : "- Do NOT include an options field"}
`;
}

export function getScoringPrompt(params: {
  jobTitle: string;
  seniority: string;
  domain: string;
  scoringThresholds?: { strongHire: number; hire: number; maybe: number; reject: number };
  questions: Array<{
    order: number;
    type: string;
    content: string;
    options?: string[];
    expectedAnswer?: string;
    difficulty: string;
    skillTested: string;
  }>;
  answers: Array<{
    questionOrder: number;
    answer: string;
  }>;
}) {
  const qaPairs = params.questions.map((q) => {
    const candidateAnswer = params.answers.find((a) => a.questionOrder === q.order);
    return `
Question ${q.order} (${q.type}, ${q.difficulty}, tests: ${q.skillTested}):
${q.content}
${q.options ? `Options: ${q.options.join(" | ")}` : ""}
${q.expectedAnswer ? `Expected Answer: ${q.expectedAnswer}` : ""}
Candidate's Answer: ${candidateAnswer?.answer || "[No answer provided]"}`;
  });

  return `You are an expert evaluator scoring a candidate's assessment for a ${params.seniority}-level ${params.jobTitle} role in ${params.domain}.

Score each answer on a scale of 0-10 and provide detailed reasoning.

${qaPairs.join("\n---\n")}

Return a JSON object with this EXACT structure:
{
  "scores": [
    {
      "questionOrder": 1,
      "score": 0-10,
      "reasoning": "Why this score was given (2-3 sentences)",
      "strengths": "What the candidate did well (1-2 sentences, or empty string if nothing notable)",
      "weaknesses": "Where the candidate fell short (1-2 sentences, or empty string if nothing notable)"
    }
  ],
  "overallSummary": "2-3 sentence summary of the candidate's performance, highlighting standout strengths and key gaps",
  "recommendation": "strongly_advance | advance | maybe | reject"
}

Scoring Guidelines:
- MCQ: Correct answer = 10, Wrong answer = 0. No partial credit.
- SHORT_ANSWER: Score based on accuracy, depth, and practical understanding (0-10)
- SCENARIO: Score based on analytical thinking, specific actionable steps, and realistic approach (0-10)
- MINI_TASK: Score based on completeness, correctness, and quality of execution (0-10)
- Empty or "[No answer provided]" = 0

Recommendation Thresholds (the recruiter has set these score boundaries as guidance):
- "strongly_advance": Score >= ${params.scoringThresholds?.strongHire ?? 80}% — Strong Hire. Exceptional across the board, deep expertise evident
- "advance": Score >= ${params.scoringThresholds?.hire ?? 60}% — Hire. Solid performance, good understanding, minor gaps acceptable
- "maybe": Score >= ${params.scoringThresholds?.maybe ?? 40}% — Maybe. Mixed results, some strengths but notable weaknesses
- "reject": Score < ${params.scoringThresholds?.reject ?? 20}% — Reject. Significant gaps in core areas, insufficient for the role's seniority level
Note: Candidates scoring between ${params.scoringThresholds?.reject ?? 20}% and ${params.scoringThresholds?.maybe ?? 40}% fall in a grey zone — use qualitative judgment to decide between "maybe" and "reject" based on core skill gaps.

Be fair but rigorous. A ${params.seniority}-level candidate should demonstrate ${params.seniority}-level depth.
`;
}
