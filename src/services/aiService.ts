import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Question, Candidate } from '../types';

// Initialize Gemini with proper error handling
let genAI: GoogleGenerativeAI | null = null;
let apiQuotaExceeded = false; // Reset quota status for new API key
let lastQuotaCheck = 0;

// Debug configuration (non-sensitive)
console.log('=== Gemini Configuration Debug ===');
console.log('Has VITE_GEMINI_API_KEY:', !!import.meta.env.VITE_GEMINI_API_KEY);
console.log('Model (fast):', import.meta.env.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash');

try {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
    genAI = new GoogleGenerativeAI(apiKey.trim());
    console.log('✅ Gemini client initialized successfully');
  } else {
    console.warn('❌ Gemini API key not configured. AI features will use fallback methods.');
  }
} catch (error) {
  console.warn('Failed to initialize Gemini client:', error);
}

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Question validation helper
const validateQuestions = (questions: any[]): Question[] => {
  return questions.map((q: any, index: number) => ({
    id: q.id || `q${index + 1}`,
    text: q.text || 'Question text missing',
    difficulty: q.difficulty || (index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard'),
    timeLimit: q.timeLimit || (index < 2 ? 50 : index < 4 ? 90 : 150), // Updated time limits: Easy=50s, Medium=90s, Hard=150s
    category: q.category || 'General'
  }));
};

// ---------------------------
// Name extraction heuristics
// ---------------------------
const toTitleCase = (s: string): string =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.length ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ')
    .trim();

const normalizeNameString = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1,
        );
      }
    }
  }

  return matrix[a.length][b.length];
};

const similarityScore = (a: string, b: string): number => {
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
};

const isLikelyName = (s: string): boolean => {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) return false;
  // exclude lines with email/phone or role words
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(trimmed)) return false;
  if (/(phone|mobile|email|address|linkedin|github|portfolio|summary|objective|education|experience|skills|projects)/i.test(trimmed)) return false;
  // should be 2-4 tokens typically
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 4) return false;
  // tokens should be alphabetic names or initials
  if (!tokens.every(t => /^[A-Za-z][A-Za-z.'-]*$/.test(t) || /^[A-Z]\.?$/.test(t))) return false;
  return true;
};

const nameFromEmail = (email?: string): string | undefined => {
  if (!email) return undefined;
  const local = email.split('@')[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const candidate = toTitleCase(parts.slice(0, 3).join(' '));
    if (isLikelyName(candidate)) return candidate;
  }
  return undefined;
};

const findNameByEmailSimilarity = (text: string, email?: string): string | undefined => {
  if (!email) return undefined;
  const localPart = email.split('@')[0] || '';
  const normalizedEmail = normalizeNameString(localPart.replace(/[._-]+/g, ' '));
  if (!normalizedEmail) return undefined;

  let bestScore = 0;
  let bestValue: string | undefined;

  // Split text into lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Strategy 1: Check individual lines (for short names)
  lines.forEach(line => {
    if (!line.trim()) return;
    const normalizedLine = normalizeNameString(line);
    if (!normalizedLine) return;
    const score = similarityScore(normalizedEmail, normalizedLine);
    // Use 50-90% range as requested
    if (score >= 0.5 && score <= 0.9 && isLikelyName(line) && score > bestScore) {
      bestScore = score;
      bestValue = toTitleCase(line);
    }
  });

  // Strategy 2: Check longer strings (2-3 line segments) for names that span multiple lines
  // or names that are part of longer text
  for (let i = 0; i < Math.min(lines.length - 1, 50); i++) {
    // Check 2-line segments
    const twoLineSegment = lines.slice(i, i + 2).join(' ').trim();
    if (twoLineSegment) {
      const normalizedSegment = normalizeNameString(twoLineSegment);
      if (normalizedSegment) {
        const score = similarityScore(normalizedEmail, normalizedSegment);
        // Extract potential name from segment (first 2-4 words)
        const words = twoLineSegment.split(/\s+/).slice(0, 4);
        const potentialName = words.join(' ');
        if (score >= 0.5 && score <= 0.9 && isLikelyName(potentialName) && score > bestScore) {
          bestScore = score;
          bestValue = toTitleCase(potentialName);
        }
      }
    }
    
    // Check 3-line segments
    if (i < lines.length - 2) {
      const threeLineSegment = lines.slice(i, i + 3).join(' ').trim();
      if (threeLineSegment) {
        const normalizedSegment = normalizeNameString(threeLineSegment);
        if (normalizedSegment) {
          const score = similarityScore(normalizedEmail, normalizedSegment);
          // Extract potential name from segment (first 2-4 words)
          const words = threeLineSegment.split(/\s+/).slice(0, 4);
          const potentialName = words.join(' ');
          if (score >= 0.5 && score <= 0.9 && isLikelyName(potentialName) && score > bestScore) {
            bestScore = score;
            bestValue = toTitleCase(potentialName);
          }
        }
      }
    }
  }

  // Strategy 3: Check longer strings by extracting potential name patterns from text chunks
  // Look for name-like patterns in longer text segments
  const textChunks = text.split(/\n\n+/); // Split by double newlines (paragraphs)
  for (const chunk of textChunks.slice(0, 10)) { // Check first 10 chunks
    const normalizedChunk = normalizeNameString(chunk);
    if (normalizedChunk.length < normalizedEmail.length * 0.5) continue; // Skip too short chunks
    
    // Extract potential name (first 2-4 words from chunk)
    const words = chunk.trim().split(/\s+/).slice(0, 4);
    const potentialName = words.join(' ');
    
    if (potentialName && isLikelyName(potentialName)) {
      const normalizedName = normalizeNameString(potentialName);
      const score = similarityScore(normalizedEmail, normalizedName);
      // Use 50-90% range
      if (score >= 0.5 && score <= 0.9 && score > bestScore) {
        bestScore = score;
        bestValue = toTitleCase(potentialName);
      }
    }
  }

  // Strategy 4: Check if email parts match any longer string segments
  // Split email local part into potential name components
  const emailParts = localPart.split(/[._-]+/).filter(p => p.length >= 2);
  if (emailParts.length >= 2) {
    // Try combinations of email parts
    for (let i = 0; i < emailParts.length; i++) {
      for (let j = i + 1; j < Math.min(emailParts.length, i + 3); j++) {
        const emailNameCandidate = emailParts.slice(i, j + 1).join(' ');
        const normalizedCandidate = normalizeNameString(emailNameCandidate);
        
        // Check against all lines and longer strings
        for (const line of lines.slice(0, 50)) {
          const normalizedLine = normalizeNameString(line);
          if (normalizedLine.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedLine)) {
            const words = line.split(/\s+/).slice(0, 4);
            const potentialName = words.join(' ');
            if (isLikelyName(potentialName)) {
              const score = similarityScore(normalizedEmail, normalizeNameString(potentialName));
              if (score >= 0.5 && score <= 0.9 && score > bestScore) {
                bestScore = score;
                bestValue = toTitleCase(potentialName);
              }
            }
          }
        }
      }
    }
  }

  return bestValue;
};

const extractNameHeuristics = (text: string, email?: string): string | undefined => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Step 0: email similarity heuristic (must be first) - now checks longer strings with 50-90% match
  const emailSimilarityName = findNameByEmailSimilarity(text, email);
  if (emailSimilarityName) return emailSimilarityName;

  // 1) look for "Name: John Doe" style
  for (const l of lines.slice(0, 20)) {
    const m = l.match(/^(?:name|full\s*name|candidate\s*name)\s*[:\-]\s*(.+)$/i);
    if (m && isLikelyName(m[1])) return toTitleCase(m[1]);
  }
  // 2) first lines often contain the name as a big heading
  for (const l of lines.slice(0, 5)) {
    // convert ALL CAPS to title case and test
    const maybe = /^[A-Z\s.'-]+$/.test(l) ? toTitleCase(l) : l;
    if (isLikelyName(maybe)) return toTitleCase(maybe);
  }
  // 3) look for line immediately before an email/phone occurrence
  for (let i = 0; i < Math.min(lines.length - 1, 30); i++) {
    const curr = lines[i];
    const next = lines[i + 1];
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(next) || /\+?\d[\d\s().-]{6,}/.test(next)) {
      const maybe = /^[A-Z\s.'-]+$/.test(curr) ? toTitleCase(curr) : curr;
      if (isLikelyName(maybe)) return toTitleCase(maybe);
    }
  }
  // 4) derive from email if available
  const fromEmail = nameFromEmail(email);
  if (fromEmail) return fromEmail;
  // 5) scan first 30 lines for likely name
  for (const l of lines.slice(0, 30)) {
    const maybe = /^[A-Z\s.'-]+$/.test(l) ? toTitleCase(l) : l;
    if (isLikelyName(maybe)) return toTitleCase(maybe);
  }
  return undefined;
};

// Parse Skills and Projects sections from resume text
const extractResumeSections = (text: string): { skills: string[]; projects: string[] } => {
  const lines = text.split(/\r?\n/);
  const normalized = lines.map(l => l.trim());
  const joined = normalized.join('\n');
  
  const sectionRegex = (title: string) => new RegExp(`(^|\\n)\\s*${title}\\s*:?\\s*(\\n|$)`, 'i');
  const findSectionRange = (titles: string[]) => {
    let start = -1;
    for (const t of titles) {
      const m = joined.match(sectionRegex(t));
      if (m) {
        start = m.index !== undefined ? m.index + (m[0].startsWith('\n') ? 1 : 0) : -1;
        break;
      }
    }
    if (start < 0) return '';
    const after = joined.slice(start);
    // skip the heading line
    const afterHeading = after.replace(/^[^\n]*\n/, '');
    // stop at next all-caps or title-looking heading or double newline gap
    const stopMatch = afterHeading.match(/\n\s*(?:[A-Z][A-Za-z ]{2,}|[A-Z ]{3,})\s*:?\s*\n/);
    const stopIdx = stopMatch ? stopMatch.index! : afterHeading.length;
    return afterHeading.slice(0, stopIdx).trim();
  };
  
  // Prioritize "Technical Skills" and include many common variations
  const skillsBlob = findSectionRange([
    'Technical Skills',  // Most common - prioritize first
    'Technical Expertise',
    'Technical Competencies',
    'Technical Proficiencies',
    'Skills',
    'Core Skills',
    'Key Skills',
    'Programming Skills',
    'Technical Knowledge',
    'Technologies',
    'Technology Stack',
    'Tech Stack',
    'Proficient In',
    'Expertise',
    'Competencies'
  ]);
  const projectsBlob = findSectionRange(['Projects', 'Project Experience', 'Personal Projects', 'Work Projects', 'Portfolio']);
  
  const splitByDelims = (blob: string) => blob
    .split(/\n|,|;|•|-|\u2022/)
    .map(s => s.trim())
    .filter(Boolean);
  
  const skills = skillsBlob ? splitByDelims(skillsBlob).slice(0, 100) : [];
  
  // For projects, try to capture lines that look like project titles or bullets
  const projects = projectsBlob
    ? projectsBlob
        .split(/\n/)
        .map(l => l.replace(/^[-*•]\s*/, '').trim())
        .filter(l => l.length > 0)
        .slice(0, 10)
    : [];
  
  return { skills, projects };
};

// Simple technology detection from resume text
const detectTechnologies = (text: string): string[] => {
  const catalog = [
    // Frontend
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Remix', 'Redux', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
    // Backend
    'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', '.NET', 'ASP.NET',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
    // Cloud/DevOps
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
    // Mobile
    'React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin',
    // Data/ML
    'Python', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    // Testing/Tools
    'Jest', 'Mocha', 'Cypress', 'Playwright',
    // General CS
    'Algorithms', 'Data Structures', 'System Design', 'REST', 'GraphQL', 'WebSockets', 'Security'
  ];
  const lower = text.toLowerCase();
  const found = new Set<string>();
  catalog.forEach((tech) => {
    const key = tech.toLowerCase();
    if (lower.includes(key)) {
      found.add(tech);
    }
  });
  return Array.from(found);
};

// API quota checker
export const checkAPICredits = async (): Promise<boolean> => {
  // Check if API key is configured
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.warn('⚠️ Gemini API key not configured');
    return false;
  }
  
  if (!genAI || apiQuotaExceeded) return false;
  
  // Don't check too frequently (every 5 minutes)
  const now = Date.now();
  if (now - lastQuotaCheck < 5 * 60 * 1000) {
    return !apiQuotaExceeded;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: (import.meta as any).env?.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash' });
    const result = await model.generateContent('ping');
    if (!result?.response) throw new Error('No response');
    apiQuotaExceeded = false;
    lastQuotaCheck = now;
    localStorage.removeItem('gemini_quota_exceeded');
    return true;
  } catch (error: any) {
    console.error('API check error:', error);
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ Gemini API quota exceeded');
      apiQuotaExceeded = true;
      lastQuotaCheck = now;
      localStorage.setItem('gemini_quota_exceeded', 'true');
      localStorage.setItem('gemini_last_quota_check', now.toString());
      return false;
    }
    // For other errors, assume API is available but log the error
    console.warn('⚠️ API check failed, but continuing:', error.message);
    return true;
  }
};

// Check if API is available without making a request
export const isAPIAvailable = (): boolean => {
  // Check if API key is configured
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }
  // Check if Gemini client is initialized and quota is not exceeded
  return !!(genAI && !apiQuotaExceeded);
};

// Reset API status (useful when user adds credits)
export const resetAPIStatus = (): void => {
  apiQuotaExceeded = false;
  lastQuotaCheck = 0;
  localStorage.removeItem('gemini_quota_exceeded');
  localStorage.removeItem('gemini_last_quota_check');
  console.log('🔄 API status reset - will attempt to use Gemini again');
};

// AI-powered data extraction
export const extractResumeDataWithAI = async (resumeText: string): Promise<Partial<Candidate>> => {
  // Check if API is available before making any requests
  if (!isAPIAvailable()) {
    console.log('🔄 Gemini API quota exceeded or unavailable, using fallback extraction');
    return extractCandidateInfoFallback(resumeText);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(1000);
    
    const model = genAI!.getGenerativeModel({
      model: (import.meta as any).env?.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = `You are an expert at extracting contact information from resumes.
Extract Name, Email, and Phone number.
Return ONLY valid JSON without any markdown formatting or code blocks.
Format: {"name": "string", "email": "string", "phone": "string"}
Resume:
${resumeText}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response?.text() || '{}';
    
    // Clean the response - remove markdown formatting if present
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON with error handling
    let extractedData: any = {};
    try {
      extractedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', cleanResponse);
      // Fallback to regex extraction if JSON parsing fails
      return extractCandidateInfoFallback(resumeText);
    }
    
    // Clear quota exceeded flag on successful API call
    if (apiQuotaExceeded) {
      apiQuotaExceeded = false;
      localStorage.removeItem('gemini_quota_exceeded');
      console.log('✅ Gemini API working again - quota issue resolved');
    }
    
    // Post-process: ensure name, possibly derive from heuristics/email if missing
    const ensured: Partial<Candidate> = { ...extractedData };
    if (!ensured.name || !isLikelyName(ensured.name)) {
      const derived = extractNameHeuristics(resumeText, ensured.email);
      if (derived) ensured.name = derived;
    } else {
      // normalize casing if name is all caps
      if (/^[A-Z\s.'-]+$/.test(ensured.name)) ensured.name = toTitleCase(ensured.name);
    }
    return ensured;
  } catch (error: any) {
    console.error('Gemini extraction error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ Gemini rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('gemini_quota_exceeded', 'true');
      localStorage.setItem('gemini_last_quota_check', lastQuotaCheck.toString());
      console.log('💡 Tip: Add credits to your OpenAI account or wait for quota reset');
      console.log('🔄 Switching to offline mode for resume parsing...');
    }
    
    // Fallback to regex-based extraction
    return extractCandidateInfoFallback(resumeText);
  }
};

// Generate a hash from resume content to ensure different resumes get different questions
const generateResumeHash = (resumeText: string, skills: string[]): string => {
  const content = `${resumeText.substring(0, 500)}${skills.join(',')}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// AI-powered question generation based on resume - FOCUSED ON SKILLS SECTION
export const generateQuestionsFromResume = async (resumeText: string): Promise<Question[]> => {
  // Always try Gemini API first - only fallback if absolutely necessary
  const { skills, projects } = extractResumeSections(resumeText);
  const techs = skills.length > 0 ? skills : detectTechnologies(resumeText);
  
  // Generate unique hash from resume content to ensure different resumes get different questions
  const resumeHash = generateResumeHash(resumeText, skills.length > 0 ? skills : techs);
  
  // Try Gemini API first
  if (isAPIAvailable()) {
    try {
      // Add delay to avoid rate limiting
      await delay(2000);
      
      const model = genAI!.getGenerativeModel({
        model: (import.meta as any).env?.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash',
        generationConfig: { 
          responseMimeType: 'application/json',
          temperature: 1.0, // Maximum temperature for maximum variation
          topP: 0.95, // Nucleus sampling for diversity
          topK: 40, // Consider top 40 tokens for more variety
        }
      });
      
      // Extract and format skills section for the prompt
      const skillsSection = skills.length > 0 
        ? skills.join(', ')
        : techs.length > 0 
          ? techs.join(', ')
          : 'General Software Engineering';
      
      const skillsList = skills.length > 0 
        ? `\n\nTECHNICAL SKILLS SECTION FROM RESUME:\n${skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : techs.length > 0
          ? `\n\nDETECTED TECHNOLOGIES/SKILLS:\n${techs.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
          : '';
      
      const projectsList = projects.length > 0 
        ? `\n\nPROJECTS MENTIONED:\n${projects.slice(0, 6).map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : '';
      
      // CRITICAL: Only proceed if we have technical skills
      if (skills.length === 0 && techs.length === 0) {
        console.warn('⚠️ No technical skills found in resume, using fallback questions');
        return generateQuestions([], projects);
      }
      
      // Add multiple variation factors to ensure completely different questions each time
      // Use resume hash to ensure different resumes get different questions
      const variationSeed = Date.now() + parseInt(resumeHash.substring(0, 8), 36);
      const randomAngle = ['performance', 'security', 'scalability', 'best practices', 'edge cases', 'debugging', 'optimization', 'architecture', 'testing', 'deployment', 'monitoring', 'error handling'][Math.floor(Math.random() * 12)];
      const randomScenario = ['production environment', 'startup scale', 'enterprise application', 'microservices', 'real-time system', 'data-intensive app', 'high-traffic website', 'mobile application', 'cloud infrastructure'][Math.floor(Math.random() * 9)];
      const randomQuestionStyle = ['scenario-based', 'code review', 'troubleshooting', 'design pattern', 'algorithm optimization', 'system design', 'conceptual understanding', 'practical implementation'][Math.floor(Math.random() * 8)];
      const randomComplexity = ['beginner-friendly', 'intermediate', 'advanced', 'expert-level'][Math.floor(Math.random() * 4)];
      
      // Add more randomization to ensure uniqueness - include resume hash
      const uniqueId = resumeHash + Math.random().toString(36).substring(2, 15);
      
      const variationPrompt = `CRITICAL: Generate COMPLETELY FRESH and UNIQUE questions that are DIFFERENT from any previous interview rounds. DO NOT reuse or rephrase previous questions.
      
MANDATORY VARIATION REQUIREMENTS:
- Unique Interview ID: ${uniqueId} - This interview session identifier
- Variation Seed: ${variationSeed} - Use this unique seed to generate different questions
- Primary Focus Angle: ${randomAngle} - Emphasize this aspect heavily in your questions
- Scenario Context: ${randomScenario} - Frame ALL questions in this specific context
- Question Style: ${randomQuestionStyle} - Use this style for most questions
- Complexity Level: ${randomComplexity} - Target this complexity level
- Question Types: Rotate between conceptual, practical, problem-solving, architecture, debugging, optimization, code review, and system design
- Real-world Scenarios: Use DIFFERENT use cases, edge cases, and practical applications than previous interviews
- Technology Depth: Mix syntax, concepts, implementation details, troubleshooting, best practices, and real-world patterns
- Difficulty Distribution: Ensure 2 easy (50s), 2 medium (90s), and 2 hard (150s) questions with varied complexity
- UNIQUENESS REQUIREMENT: Each question must be COMPLETELY UNIQUE. Do NOT:
  * Repeat any question from previous interviews
  * Use similar wording or structure
  * Ask about the same concepts in the same way
  * Reuse scenarios or examples
- Fresh Perspectives: Approach the same technologies from COMPLETELY DIFFERENT angles each time
- Question Variety: Use different question formats (scenario-based, code snippets, theoretical, practical)
- Ensure questions are NOT chronologically similar - they should be fundamentally different questions`;
      
      const prompt = `You are an expert technical interviewer. Generate EXACTLY 6 COMPLETELY UNIQUE interview questions for a full-stack developer role.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. **MANDATORY**: Generate questions STRICTLY and EXCLUSIVELY based on the TECHNICAL SKILLS listed below.
2. **STRICT RULE**: You MUST generate questions ONLY about the specific technical skills provided. DO NOT ask about technologies, frameworks, or tools that are NOT in the skills list.
3. **SKILLS-ONLY FOCUS**: Each question must directly relate to one or more of the technical skills listed. General programming questions are NOT allowed unless the skill is explicitly listed.
4. Create EXACTLY 2 easy (50 seconds each), 2 medium (90 seconds each), and 2 hard (150 seconds each) questions.
5. Each question should test practical knowledge and application of the listed technical skills in real-world scenarios.
6. Questions should be relevant to actual usage of these specific technologies in production environments.
7. ${variationPrompt}
8. **UNIQUENESS**: This is interview session ${variationSeed} for resume hash ${resumeHash}. Generate questions that are FUNDAMENTALLY DIFFERENT from any previous interview. Do NOT reuse, rephrase, or adapt previous questions.
9. Each question must be ORIGINAL and UNIQUE - not just a variation of a common question.
10. Use the unique interview ID (${uniqueId}) to ensure this set is completely different.
11. Return EXACTLY 6 questions, no more, no less.
12. Ensure questions are NOT chronologically similar - they should be different questions, not just different order.

${skillsList}
${projectsList}

**STRICT REQUIREMENTS - READ THIS CAREFULLY:**
${skills.length > 0 
  ? `CRITICAL: You MUST generate questions ONLY about the TECHNICAL SKILLS listed above. These are the candidate's actual technical skills from their resume. 

FORBIDDEN:
- DO NOT ask about technologies not mentioned in the Technical Skills section
- DO NOT ask general programming questions unless the skill is explicitly listed
- DO NOT assume knowledge of frameworks or tools not in the skills list
- DO NOT create generic questions about software engineering

REQUIRED:
- Every question MUST be directly related to at least one skill from the list above
- Questions should test practical application of these specific technologies
- Focus on real-world scenarios using ONLY the listed technologies`
  : techs.length > 0
    ? `CRITICAL: Generate questions based STRICTLY on the detected technologies above. 

FORBIDDEN:
- DO NOT ask about technologies not detected in the resume
- DO NOT create generic programming questions
- DO NOT assume knowledge beyond the detected technologies

REQUIRED:
- Every question MUST relate to the detected technologies
- Focus on practical application of these specific technical skills
- Test real-world usage of ONLY the detected technologies`
    : `WARNING: No Technical Skills section found. This should not happen if skills were detected. Using fallback.`
}

Return ONLY valid JSON without any markdown formatting or code blocks. Format:
{"questions": [{"id":"string","text":"string","difficulty":"easy|medium|hard","timeLimit":number,"category":"string"}]}`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response?.text() || '{}';
      
      // Clean the response - remove markdown formatting if present
      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parse JSON with error handling
      let response: any = { questions: [] };
      try {
        response = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', cleanResponse);
        // Fallback to local question generation if JSON parsing fails
        console.log('🔄 JSON parsing failed, using fallback questions');
        return generateQuestions(techs, projects);
      }
      
      // Validate and limit to exactly 6 questions
      let questions = response.questions || [];
      console.log(`✅ Gemini AI generated ${questions.length} questions from skills section`);
      
      // Ensure we have exactly 6 questions
      if (questions.length > 6) {
        console.warn(`🚨 AI generated ${questions.length} questions, limiting to 6`);
        questions = questions.slice(0, 6);
      }
      
      // Ensure we have at least 6 questions by padding with fallback questions if needed
      if (questions.length < 6) {
        console.warn(`AI generated only ${questions.length} questions, using fallback for missing questions`);
        const fallbackQuestions = await generateQuestions(techs, projects);
        const neededQuestions = 6 - questions.length;
        console.log(`🔍 Adding ${neededQuestions} fallback questions`);
        questions = [...questions, ...fallbackQuestions.slice(0, neededQuestions)];
        console.log(`🔍 After padding: ${questions.length} questions`);
      }
      
      // Validate question structure
      questions = validateQuestions(questions);
      
      // Final safety check - ensure exactly 6 questions
      if (questions.length !== 6) {
        console.error(`🚨 CRITICAL: Expected 6 questions, got ${questions.length}! Forcing to 6.`);
        if (questions.length > 6) {
          questions = questions.slice(0, 6);
        } else {
          const fallbackQuestions = await generateQuestions(techs, projects);
          questions = [...questions, ...fallbackQuestions.slice(0, 6 - questions.length)];
        }
      }
      
      console.log(`✅ Generated ${questions.length} questions for interview`);
      console.log('🔍 Final questions array:', questions.map((q: Question) => ({ id: q.id, text: q.text.substring(0, 50) + '...', difficulty: q.difficulty })));
      
      // Clear quota exceeded flag on successful API call
      if (apiQuotaExceeded) {
        apiQuotaExceeded = false;
        localStorage.removeItem('gemini_quota_exceeded');
        console.log('✅ Gemini API working again - quota issue resolved');
      }
      
      return questions;
    } catch (error: any) {
      console.error('Gemini question generation error:', error);
      
      // Handle rate limiting specifically
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.warn('❌ Gemini rate limit exceeded, marking API as unavailable');
        apiQuotaExceeded = true;
        lastQuotaCheck = Date.now();
        localStorage.setItem('gemini_quota_exceeded', 'true');
        localStorage.setItem('gemini_last_quota_check', lastQuotaCheck.toString());
        console.log('🔄 Using fallback questions');
      }
      
      // Fall through to fallback
      console.log('🔄 Falling back to local question generation');
      return generateQuestions(techs, projects);
    }
  }
  
  // Fallback if API not available
  console.log('🔄 Gemini API quota exceeded or unavailable, using fallback question generation');
  return generateQuestions(techs, projects);
};

// AI-powered answer evaluation
export const evaluateAnswerWithAI = async (question: Question, answer: string): Promise<number> => {
  if (!isAPIAvailable()) {
    console.log('🔄 Gemini API quota exceeded or unavailable, using fallback evaluation');
    return evaluateAnswer(question, answer);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(1500);
    
    const model = genAI!.getGenerativeModel({
      model: (import.meta as any).env?.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = `You are an expert technical interviewer evaluating candidate answers.
Rate the answer on a scale of 0-100 based on:
- Technical accuracy
- Completeness of response
- Understanding of concepts
- Practical application
- Communication clarity

Consider the question difficulty:
- Easy (0-50s): Basic concepts, simple explanations
- Medium (0-90s): Intermediate concepts, some depth
- Hard (0-150s): Advanced concepts, complex problem-solving

Return ONLY valid JSON without markdown. Format: {"score": number, "feedback": "string"}

Question (${question.difficulty} - ${question.timeLimit}s): ${question.text}
Candidate Answer: ${answer}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response?.text() || '{"score": 0}';
    
    // Clean the response - remove markdown formatting if present
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON with error handling
    let evaluation: any = { score: 0 };
    try {
      evaluation = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', cleanResponse);
      // Fallback to local evaluation if JSON parsing fails
      console.log('🔄 JSON parsing failed, using fallback evaluation');
      return evaluateAnswer(question, answer);
    }
    
    // Validate score is a number
    const score = typeof evaluation.score === 'number' ? evaluation.score : 0;
    return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
  } catch (error: any) {
    console.error('Gemini evaluation error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ Gemini rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('gemini_quota_exceeded', 'true');
      localStorage.setItem('gemini_last_quota_check', lastQuotaCheck.toString());
      console.log('🔄 Using fallback evaluation');
    }
    
    return evaluateAnswer(question, answer);
  }
};

// AI-powered summary generation
export const generateSummaryWithAI = async (candidate: any, questions: Question[], answers: any[]): Promise<string> => {
  if (!isAPIAvailable()) {
    console.log('🔄 Gemini API quota exceeded or unavailable, using fallback summary generation');
    return generateSummary(candidate, questions, answers);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(2500);
    
    const model = genAI!.getGenerativeModel({
      model: (import.meta as any).env?.VITE_GEMINI_MODEL_FAST || 'gemini-1.5-flash'
    });
    const prompt = `You are an expert HR professional creating candidate evaluation summaries.
Analyze the interview performance and provide a comprehensive summary including:
- Overall performance assessment
- Strengths demonstrated
- Areas for improvement
- Technical competency level
- Recommendation for next steps

Be professional, constructive, and specific.

Create a summary for candidate: ${candidate.name}

Interview Questions and Answers:
${questions.map((q, index) => `Q${index + 1} (${q.difficulty}): ${q.text}
A${index + 1}: ${answers[index]?.text || 'No answer provided'}
Score: ${answers[index]?.score || 0}/100`).join('\n')}

MCQ Assessment:
Score: ${candidate.mcqScore ?? 0}/100
Correct Answers: ${(candidate.mcqResponses?.filter((r: any) => r.isCorrect).length) || 0}/${candidate.mcqQuestions?.length || 0}

Final Score: ${candidate.finalScore}/100

Generate a professional evaluation summary.`;
    const result = await model.generateContent(prompt);
    return result.response?.text() || 'No summary available';
  } catch (error: any) {
    console.error('Gemini summary generation error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ Gemini rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('gemini_quota_exceeded', 'true');
      localStorage.setItem('gemini_last_quota_check', lastQuotaCheck.toString());
      console.log('🔄 Using fallback summary');
    }
    
    return generateSummary(candidate, questions, answers);
  }
};

// Fallback function for data extraction
export const extractCandidateInfoFallback = (text: string): Partial<Candidate> => {
  const extractedData: Partial<Candidate> = {
    resumeText: text,
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    extractedData.email = emailMatch[0];
  }

  // Extract phone number
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?([0-9]{2,4})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{3,4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    extractedData.phone = phoneMatch[0];
  }

  // Extract name using heuristics (robust across formats)
  const derivedName = extractNameHeuristics(text, extractedData.email);
  if (derivedName) extractedData.name = derivedName;

  return extractedData;
};

// Keep existing fallback functions
export const generateQuestions = async (preferredTopics?: string[], projects?: string[]): Promise<Question[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🔍 Generating fallback questions...');
  const topics = preferredTopics && preferredTopics.length > 0
    ? preferredTopics
    : ['Algorithms', 'Data Structures', 'Databases', 'HTTP/REST', 'Security', 'System Design', 'General Programming'];

  const pick = (choices: string[], fallback: string) => choices.find(c => topics.includes(c)) || fallback;
  const projectHint = (suffix: string) => {
    if (projects && projects.length) {
      const p = projects[0];
      return ` In the context of the project "${p}", ${suffix}`;
    }
    return '';
  };

  const questions: Question[] = [
    // Easy Questions
    {
      id: 'q1',
      text: `Explain the difference between ${pick(['let', 'const'], 'let')} and ${pick(['var'], 'var')} in modern JavaScript. When would you use each?${projectHint('how would you choose variable declarations?')}`,
      difficulty: 'easy',
      timeLimit: 50,
      category: pick(['JavaScript', 'General Programming'], 'General Programming'),
    },
    {
      id: 'q2',
      text: `What are HTTP status codes and what is the difference between ${pick(['200 OK'], '200 OK')} and ${pick(['201 Created'], '201 Created')}?${projectHint('how would your API handle these cases?')}`,
      difficulty: 'easy',
      timeLimit: 50,
      category: pick(['HTTP/REST'], 'HTTP/REST'),
    },
    // Medium Questions
    {
      id: 'q3',
      text: `Design a database schema for a simple blogging platform. Discuss tables, keys, and indexing strategies.${projectHint('what schema choices would you make?')}`,
      difficulty: 'medium',
      timeLimit: 90,
      category: pick(['Databases', 'PostgreSQL', 'MySQL', 'MongoDB'], 'Databases'),
    },
    {
      id: 'q4',
      text: `Given an unsorted array, how would you find the ${pick(['kth largest'], 'kth largest')} element efficiently? Discuss time and space complexity.${projectHint('where could this be relevant?')}`,
      difficulty: 'medium',
      timeLimit: 90,
      category: pick(['Algorithms', 'Data Structures'], 'Algorithms'),
    },
    // Hard Questions
    {
      id: 'q5',
      text: `Design a scalable URL shortener service. Cover API design, data storage, collisions, and high availability.${projectHint('which scaling strategies would you choose?')}`,
      difficulty: 'hard',
      timeLimit: 150,
      category: pick(['System Design'], 'System Design'),
    },
    {
      id: 'q6',
      text: `How would you secure a public REST API? Discuss authentication, authorization, rate limiting, input validation, and common vulnerabilities (e.g., injection).${projectHint('how would you apply this to your project?')}`,
      difficulty: 'hard',
      timeLimit: 150,
      category: pick(['Security'], 'Security'),
    },
  ];

  console.log(`🔍 Fallback generated ${questions.length} questions`);
  return questions;
};

export const evaluateAnswer = async (question: Question, answer: string): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock scoring logic - in a real implementation, this would use AI to evaluate the answer
  const baseScore = getBaseScoreByDifficulty(question.difficulty);
  const answerLength = answer.trim().length;
  
  // Simple scoring based on answer length and content
  let score = baseScore;
  
  if (answerLength < 10) {
    score = Math.max(0, score - 20); // Very short answers get penalized
  } else if (answerLength > 100) {
    score = Math.min(100, score + 10); // Longer, thoughtful answers get bonus
  }
  
  // Add some randomness to simulate AI evaluation
  const randomFactor = (Math.random() - 0.5) * 10;
  score = Math.max(0, Math.min(100, score + randomFactor));
  
  return Math.round(score);
};

const getBaseScoreByDifficulty = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': return 70;
    case 'medium': return 60;
    case 'hard': return 50;
    default: return 50;
  }
};

export const generateSummary = async (candidate: any, questions: Question[], answers: any[]): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const averageScore = totalScore / answers.length;
  
  const completedQuestions = answers.length;
  const totalQuestions = questions.length;
  
  let summary = `Candidate ${candidate.name} completed ${completedQuestions}/${totalQuestions} questions with an average score of ${Math.round(averageScore)}/100. `;
  
  if (averageScore >= 80) {
    summary += 'The candidate demonstrated strong technical knowledge and provided comprehensive answers. ';
  } else if (averageScore >= 60) {
    summary += 'The candidate showed good understanding of the topics with room for improvement. ';
  } else {
    summary += 'The candidate may need additional training or experience in the technical areas covered. ';
  }
  
  // Add specific feedback based on performance
  const easyAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'easy');
  // const mediumAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'medium');
  const hardAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'hard');
  
  if (easyAnswers.length > 0) {
    const easyAvg = easyAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / easyAnswers.length;
    if (easyAvg >= 80) {
      summary += 'Strong performance on fundamental concepts. ';
    }
  }
  
  if (hardAnswers.length > 0) {
    const hardAvg = hardAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / hardAnswers.length;
    if (hardAvg >= 70) {
      summary += 'Excellent problem-solving skills demonstrated in complex scenarios. ';
    } else if (hardAvg < 40) {
      summary += 'May need more experience with advanced technical challenges. ';
    }
  }
  
  summary += `Overall recommendation: ${averageScore >= 70 ? 'Proceed to next round' : 'Consider for junior role or additional training'}.`;
  
  return summary;
};

// Real AI integration functions (commented out for now)
/*
export const generateQuestionsWithAI = async (): Promise<Question[]> => {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'full-stack-developer',
      difficulty: 'mixed',
      count: 6,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate questions');
  }
  
  return await response.json();
};

export const evaluateAnswerWithAI = async (question: Question, answer: string): Promise<number> => {
  const response = await fetch('/api/evaluate-answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: question.text,
      answer: answer,
      difficulty: question.difficulty,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to evaluate answer');
  }
  
  const result = await response.json();
  return result.score;
};
*/
