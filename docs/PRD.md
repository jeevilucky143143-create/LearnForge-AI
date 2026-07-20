PDF2Course — Product Requirements Document (PRD)

Version: 1.1
Document Status: Draft
Purpose:
This document defines the product requirements for the PDF2Course Learning Platform. It focuses on what the product should achieve, the user problems it solves, the expected functionality, and the project scope. It intentionally avoids implementation details such as system architecture, APIs, database schemas, folder structures, or development workflows. These will be documented separately in a Software Design Document (SDD).

Table of Contents
1. Overview
2. Product Vision
3. Product Objectives
4. Project Scope
5. Target Users
6. Essential Core Features
7. Non-Functional Requirements
8. User Journey
9. Technology Requirements
10. Assumptions and Constraints
11. Success Criteria
12. Future Considerations
13. Conclusion

## Product Vision

The vision of PDF2Course is to transform static educational PDF documents into structured, interactive learning experiences using Artificial Intelligence. Instead of reading lengthy documents from start to finish, learners should be able to navigate organized lessons, understand concepts more effectively, track their learning progress, interact with an AI learning companion, and evaluate their understanding through quizzes.

## Product Objectives

- Convert educational PDFs into structured learning courses.
- Simplify self-paced learning from lengthy documents.
- Improve learner engagement using AI-assisted learning.
- Enable users to resume learning across sessions.
- Help learners reinforce knowledge through quizzes and summaries.
- Maintain a personalized learning experience for every authenticated user.

## Project Scope

This product includes only the functionality described in the internship assignment:
- User Authentication
- PDF Upload and Processing
- AI Course Generation
- Learning Progress Tracking
- AI Learning Companion
- Quiz Generation
- Course Dashboard
- Search
- Learning History
- Responsive User Experience

Any functionality beyond the above should be treated as future enhancement unless explicitly required.



# PDF2Course — Product Requirements Document (PRD)

***

## 1\. Overview

**App/Website Name:** PDF2Course

PDF2Course is a full-stack, AI-powered web application that transforms uploaded PDF documents — including textbooks, research papers, technical documentation, lecture notes, and study materials — into fully structured, interactive learning courses. By leveraging large language models (LLMs), the platform extracts raw content from PDFs and intelligently organizes it into a coherent course architecture comprising chapters, topics, subtopics, and individual lessons, each enriched with explanations, key takeaways, real-world examples, quizzes, and summaries. The result is a personalized e-learning experience generated automatically from any educational document a user provides.

The platform addresses a widespread challenge faced by students, professionals, researchers, and self-learners: consuming and retaining knowledge from dense, unstructured PDF content is cognitively demanding and inefficient. PDF2Course solves this by acting as an intelligent learning intermediary — converting passive reading material into an active, guided course experience complete with an AI learning companion, progress tracking, quiz assessments, and contextual search. The target audience includes university students, lifelong learners, corporate training teams, educators, and anyone who regularly engages with educational documents and seeks a smarter way to absorb and retain that knowledge.

***

## 2\. Essential Core Features

### 2.1 User Authentication

* Secure user registration and login via email/password and OAuth providers (e.g., Google).
* Each user maintains a private, personalized account with isolated access to their own courses, history, and progress data.
* Password recovery and session management are supported.
* All routes beyond the landing page are protected and accessible only to authenticated users.

### 2.2 PDF Upload & Processing

* Users can upload single or multiple PDF documents through a drag-and-drop interface or a file picker.
* The system accepts multi-page PDFs and extracts all readable text content.
* Document metadata (file name, page count, upload timestamp, file size) is captured and stored.
* Users can view a list of all previously uploaded PDFs and their processing status (pending, processing, completed, failed).
* PDF storage is managed securely in cloud storage with access restricted to the document owner.

### 2.3 AI Course Generation

* Upon successful PDF upload, the AI pipeline processes the extracted content and generates a fully structured course containing:
    * **Course Title** — A descriptive, context-aware title.
    * **Course Description** — A concise summary of the course content and scope.
    * **Estimated Learning Time** — An approximate total time to complete the course.
    * **Learning Objectives** — A bulleted list of what the learner will achieve.
    * **Prerequisites** — Recommended background knowledge before starting.
    * **Difficulty Level** — Beginner, Intermediate, or Advanced classification.
    * **Table of Contents** — A navigable outline of the full course structure.
    * **Chapters → Topics → Subtopics → Lessons** — A hierarchically organized content structure.
* Each individual lesson includes:
    * Clear, AI-generated explanations of the concept.
    * Important notes and highlighted warnings or caveats.
    * Key takeaways summarizing the most critical points.
    * Real-world examples to contextualize abstract concepts.
    * A lesson summary for quick review.
* Course generation status is displayed to the user with a loading/progress indicator.
* Generated courses are saved to the user's dashboard for repeated access.

### 2.4 Learning Progress Tracking

* Users can mark individual lessons as completed.
* Chapter-level completion is automatically calculated based on lesson completion within it.
* Overall course completion percentage is computed and displayed on the course dashboard.
* The platform saves the user's last-visited lesson and allows one-click resumption of learning.
* Progress data persists across sessions and devices.

### 2.5 AI Learning Companion (Chatbot)

* Each course includes a context-aware AI chatbot embedded within the learning interface.
* The chatbot is scoped to the content of the uploaded document and can:
    * Answer questions about specific lessons, topics, or chapters.
    * Explain concepts in alternative ways or at different complexity levels.
    * Summarize any chapter or topic on demand.
    * Generate on-the-fly quiz questions about any lesson or topic.
    * Suggest the next recommended lesson or study path.
    * Maintain conversation history for the duration of the session.
* Chatbot conversations are saved and accessible via the user's learning history.

### 2.6 Quiz Generation

* Quizzes are automatically generated for each chapter upon course creation.
* Supported question formats:
    * Multiple-choice questions (MCQ) with four answer options.
    * True/False questions.
    * Short-answer questions.
* After quiz submission, users receive:
    * Their total score and percentage.
    * Correct answers for each question.
    * Explanations for why each answer is correct or incorrect.
* Quiz attempt history is saved per user per course.
* Users may retake quizzes to improve their scores.

### 2.7 Course Dashboard

* The dashboard is the central hub for each authenticated user and displays:
    * All uploaded courses with thumbnail, title, difficulty, and completion percentage.
    * Recently accessed courses for quick navigation.
    * Learning statistics (total courses, total lessons completed, total quiz attempts, average quiz score).
    * Optional learning streaks showing consecutive days of activity.
* Courses are sortable and filterable by status (in-progress, completed, not started) and difficulty level.

### 2.8 In-Course Search

* A search interface allows users to search within a course across:
    * Chapter titles.
    * Topic and subtopic titles.
    * Lesson titles.
    * Lesson content keywords.
* Search results are displayed with context snippets and direct navigation links to the relevant lesson.

### 2.9 Learning History

* A dedicated history section maintains a full record of:
    * All uploaded PDFs and their associated generated courses.
    * Lesson-level and course-level learning progress over time.
    * All chatbot conversations, organized by course and date.
    * All quiz attempts with scores and timestamps.
* Users can delete entries from their history if needed.

### 2.10 Responsive User Interface

* The web application is fully responsive and optimized for desktop, tablet, and mobile browsers.
* All features — course navigation, chatbot, quizzes, and progress tracking — function seamlessly across screen sizes.
* The interface adapts layout and typography to provide a comfortable reading and learning experience on all viewports.

***

## 3\. Tech Stack

### Front-End

* **Framework:** React (with Vite as the build tool)
* **Styling:** Tailwind CSS
* **Component Library:** shadcn/ui for pre-built, accessible UI components
* **State Management:** React Context API or Zustand for lightweight global state
* **Routing:** React Router v6

### Back-End

* **Platform:** Supabase
    * **Authentication:** Supabase Auth (email/password + OAuth via Google)
    * **Database:** Supabase PostgreSQL for storing user data, course structures, progress, quiz results, and chat history
    * **Storage:** Supabase Storage for secure PDF file storage
    * **Real-Time:** Supabase real-time subscriptions for live course generation status updates
    * **Edge Functions:** Supabase Edge Functions for invoking AI processing pipelines and handling server-side logic

### AI Integration

* **Primary AI Provider:** OpenAI GPT-4o for all text-related AI features including:
    * Course structure generation from extracted PDF content.
    * Lesson content enrichment (explanations, examples, takeaways, summaries).
    * Quiz question generation.
    * AI Learning Companion chatbot responses.
* **PDF Text Extraction:** Handled server-side within Supabase Edge Functions prior to AI processing.

### APIs & Integrations

* **OpenAI API (GPT-4o):** Core AI processing for course generation, quiz generation, and chatbot.
* **Supabase Client SDK:** Used on the frontend for auth, database queries, storage access, and real-time updates.
* **OAuth 2.0 (Google):** For social login via Supabase Auth providers.

### Deployment

* **Frontend:** Vercel (React + Vite static deployment)
* **Backend & Database:** Supabase (managed cloud platform)

### Technical Considerations

* PDF text extraction must handle multi-page documents reliably; large PDFs should be chunked and processed in segments to stay within LLM context window limits.
* AI generation is an asynchronous process; users should receive real-time status feedback while their course is being generated.
* All API keys and secrets must be stored securely as environment variables and never exposed to the client.
* Row-Level Security (RLS) must be enforced in Supabase to ensure each user can only access their own data.

***

## 4\. Design Preferences

### Interface

The interface should feel clean, modern, and academically professional — similar to a premium online learning platform — with generous whitespace, clear typographic hierarchy, and structured content layouts that reduce cognitive load during learning sessions.

### Color Palette

| Role | Color | Hex |
| ---- | ----- | --- |
| Primary | Deep Indigo | `#4F46E5` |
| Primary Dark | Indigo 700 | `#4338CA` |
| Secondary | Slate Gray | `#64748B` |
| Background | Off-White | `#F8FAFC` |
| Surface | White | `#FFFFFF` |
| Accent | Emerald Green | `#10B981` |
| Danger/Error | Rose Red | `#F43F5E` |
| Text Primary | Slate 900 | `#0F172A` |
| Text Secondary | Slate 500 | `#64748B` |
| Border | Slate 200 | `#E2E8F0` |

### Typography

| Usage | Font Family | Weight |
| ----- | ----------- | ------ |
| Headings | **Inter** | 700 (Bold), 600 (SemiBold) |
| Body Text | **Inter** | 400 (Regular), 500 (Medium) |
| Code/Mono | **JetBrains Mono** | 400 |
| UI Labels | **Inter** | 500 (Medium) |

### Additional Design Considerations

* **Lesson Reading View:** A distraction-free, document-like reading layout with a maximum content width of approximately 720px for comfortable reading.
* **Sidebar Navigation:** A collapsible left sidebar within the course viewer for chapter and lesson navigation, keeping the reading area clean.
* **Progress Indicators:** Use circular progress rings on course cards and horizontal progress bars within course views.
* **Status Badges:** Color-coded badges for difficulty levels (Beginner = green, Intermediate = amber, Advanced = red).
* **Chatbot Panel:** A sliding right-side drawer panel for the AI companion to avoid interrupting the reading layout.
* **Dark Mode:** Optional dark mode support using Tailwind's dark variant for extended reading sessions.
* **Animations:** Subtle transitions (Framer Motion or Tailwind transitions) for page loads, sidebar toggles, and chatbot panel open/close.
* **Icons:** Lucide React icon library for consistent, lightweight iconography throughout the UI.

***

## 5\. All Screens/Pages

***

### 5.1 Landing Page

**Route:** `/`

**UI Elements & Components:**

* Top navigation bar with logo (PDF2Course), navigation links (Features, How It Works, Pricing), and CTA buttons (Log In, Get Started)
* Hero section with headline, subheadline, and primary CTA button ("Upload Your First PDF — It's Free")
* Animated or static product screenshot/mockup preview
* "How It Works" section with 3-step visual flow (Upload PDF → AI Generates Course → Start Learning)
* Features highlight section with icon cards describing core features
* Testimonials or social proof section (placeholder)
* Footer with links (Terms, Privacy, Contact)

**Navigation:**

* "Get Started" / "Sign Up" → `/register`
* "Log In" → `/login`
* Logo → `/`

**Conditional Elements:**

* If user is already authenticated: CTA button changes to "Go to Dashboard" → `/dashboard`

***

### 5.2 Registration Page

**Route:** `/register`

**UI Elements & Components:**

* PDF2Course logo and page title ("Create Your Account")
* Full name input field
* Email address input field
* Password input field with show/hide toggle
* Confirm password input field
* "Sign Up" submit button
* Google OAuth sign-up button ("Continue with Google")
* Link to login page ("Already have an account? Log In")
* Inline validation error messages
* Terms of Service and Privacy Policy acknowledgment text

**Navigation:**

* Successful registration → `/dashboard`
* "Log In" link → `/login`
* Logo → `/`

***

### 5.3 Login Page

**Route:** `/login`

**UI Elements & Components:**

* PDF2Course logo and page title ("Welcome Back")
* Email address input field
* Password input field with show/hide toggle
* "Forgot Password?" link
* "Log In" submit button
* Google OAuth login button ("Continue with Google")
* Link to registration ("Don't have an account? Sign Up")
* Inline error messages for invalid credentials

**Navigation:**

* Successful login → `/dashboard`
* "Sign Up" link → `/register`
* "Forgot Password?" → `/forgot-password`

***

### 5.4 Forgot Password Page

**Route:** `/forgot-password`

**UI Elements & Components:**

* Page title ("Reset Your Password")
* Email input field
* "Send Reset Link" button
* Success message state ("Check your email for a reset link")
* Back to Login link

**Navigation:**

* "Back to Login" → `/login`
* After email sent: static success state displayed on same page

***

### 5.5 Dashboard

**Route:** `/dashboard`

**UI Elements & Components:**

* Top navigation bar (logo, search icon, user avatar/dropdown)
* Left sidebar navigation (Dashboard, My Courses, Upload PDF, History, Settings)
* Welcome header with user's first name
* Summary statistics row: Total Courses, Lessons Completed, Average Quiz Score, Learning Streak
* "Continue Learning" section — card of the most recently accessed in-progress course with resume button
* "My Courses" section — grid of course cards, each showing:
    * Course title
    * Difficulty badge
    * Completion percentage ring
    * Estimated time
    * Last accessed date
    * "Continue" or "Start" button
* "Upload New PDF" shortcut card/button
* Empty state illustration and CTA when no courses exist

**Navigation:**

* Course card "Continue/Start" → `/course/:courseId`
* "Upload New PDF" → `/upload`
* Sidebar links → respective routes
* User avatar dropdown → Profile, Settings, Log Out

**Conditional Elements:**

* Empty state shown when user has no courses
* "Continue Learning" section only shown when an in-progress course exists

***

### 5.6 PDF Upload Page

**Route:** `/upload`

**UI Elements & Components:**

* Page title ("Upload a PDF to Generate a Course")
* Drag-and-drop file upload zone with icon and helper text
* File picker button fallback ("Browse Files")
* Accepted file type indicator (PDF only) and maximum file size notice
* Uploaded file preview card (file name, page count, file size, remove button)
* "Generate Course" submit button (disabled until a valid file is selected)
* Processing status screen (shown after submission):
    * Animated progress/loading indicator
    * Step-by-step status messages (e.g., "Extracting content…", "Generating chapters…", "Finalizing lessons…")
    * Cancel button
* Error state for unsupported file types or oversized files

**Navigation:**

* Successful course generation → `/course/:courseId` (auto-redirect)
* Cancel → `/dashboard`
* Sidebar navigation always accessible

***

### 5.7 Course Overview Page

**Route:** `/course/:courseId`

**UI Elements & Components:**

* Course header banner with:
    * Course title
    * Description
    * Difficulty badge
    * Estimated learning time
    * Overall progress bar and percentage
    * "Resume Learning" button (navigates to last incomplete lesson)
* Tab navigation within the page: Overview \| Curriculum \| Quizzes
* **Overview Tab:**
    * Learning objectives list
    * Prerequisites list
    * Course statistics (total chapters, total lessons, quizzes available)
* **Curriculum Tab:**
    * Accordion-style table of contents showing all chapters
    * Each chapter expands to show topics and lessons
    * Lesson rows show title, estimated time, and completion checkmark
    * Clickable lessons navigate to the lesson viewer
* **Quizzes Tab:**
    * List of available chapter quizzes with best score, attempt count, and "Take Quiz" / "Retake" button

**Navigation:**

* Lesson click → `/course/:courseId/lesson/:lessonId`
* "Take Quiz" → `/course/:courseId/quiz/:chapterId`
* Back to Dashboard → `/dashboard`
* Sidebar always accessible

***

### 5.8 Lesson Viewer Page

**Route:** `/course/:courseId/lesson/:lessonId`

**UI Elements & Components:**

* **Left Sidebar (Collapsible):**
    * Course title header
    * Full course curriculum tree (chapters, topics, lessons)
    * Active lesson highlighted
    * Chapter collapse/expand controls
    * Completion status icons per lesson
* **Main Content Area:**
    * Lesson title (H1)
    * Breadcrumb navigation (Course → Chapter → Topic → Lesson)
    * Lesson body sections:
        * Explanation content (rich text)
        * Important Notes callout block
        * Key Takeaways bulleted list
        * Real-World Examples section
        * Lesson Summary block
    * "Mark as Complete" button / completed state indicator
    * Previous Lesson / Next Lesson navigation buttons at bottom
* **Right Panel — AI Companion (Sliding Drawer):**
    * "Ask AI" toggle button (floating or in header)
    * Chat message thread (user and AI messages)
    * Text input field with send button
    * Suggested quick-action buttons (e.g., "Summarize this lesson", "Quiz me", "Explain simpler")
    * Chat history scrollable area
* **Top Bar:**
    * Course title
    * Progress bar for overall course
    * Search icon
    * AI Companion toggle button
    * User avatar

**Navigation:**

* Previous / Next lesson buttons → adjacent lesson routes
* Breadcrumb → Course Overview page
* Curriculum sidebar lesson click → respective lesson
* "Back to Course" → `/course/:courseId`
* AI Companion drawer opens/closes as an overlay on the right

**Conditional Elements:**

* "Mark as Complete" changes to a "Completed ✓" badge once clicked
* Next/Previous buttons disabled on first and last lessons respectively
* AI Companion drawer hidden by default; toggled open by user

***

### 5.9 Quiz Page

**Route:** `/course/:courseId/quiz/:chapterId`

**UI Elements & Components:**

* Quiz header: Chapter title, total question count, timer (optional)
* Question progress indicator (e.g., "Question 3 of 10")
* Question card:
    * Question text
    * Answer options (radio buttons for MCQ, toggle for True/False, text input for short answer)
* "Next Question" / "Previous Question" navigation buttons
* "Submit Quiz" button (shown on last question or after all answered)
* **Results Screen (post-submission):**
    * Score display (e.g., "8 / 10 — 80%") with pass/fail indicator
    * Score breakdown visual (progress ring)
    * Per-question review:
        * Question text
        * User's answer (highlighted correct/incorrect)
        * Correct answer
        * Explanation text
    * "Retake Quiz" button
    * "Back to Course" button

**Navigation:**

* "Back to Course" / completion → `/course/:courseId`
* Retake → resets quiz state on same route

**Conditional Elements:**

* Submit button only becomes active when all questions are answered
* Results screen replaces quiz screen upon submission

***

### 5.10 Search Results Page

**Route:** `/search?q=:query` (or inline modal/overlay)

**UI Elements & Components:**

* Search input field (pre-filled with query)
* Results count indicator ("Showing 12 results for 'machine learning'")
* Filter options: All \| Chapters \| Topics \| Lessons
* Result cards displaying:
    * Content type badge (Chapter / Topic / Lesson)
    * Title
    * Parent course name
    * Content snippet with search term highlighted
    * "Go to Lesson" / "Go to Chapter" link button
* Empty state for no results
* Loading skeleton state

**Navigation:**

* Result card click → respective lesson or chapter in course viewer
* Back → previous page

***

### 5.11 Learning History Page

**Route:** `/history`

**UI Elements & Components:**

* Page title ("Learning History")
* Tabbed interface: All \| Courses \| Quizzes \| Conversations
* **Courses Tab:**
    * List of all uploaded PDFs and generated courses with upload date, status, and link to course
    * Delete course option with confirmation modal
* **Quizzes Tab:**
    * List of all quiz attempts with course name, chapter, score, date, and link to review
* **Conversations Tab:**
    * List of AI chatbot conversation sessions organized by course and date
    * Expandable conversation threads to review past messages
* Empty states per tab

**Navigation:**

* Course link → `/course/:courseId`
* Quiz review link → `/course/:courseId/quiz/:chapterId` results view
* Sidebar navigation always accessible

***

### 5.12 Settings Page

**Route:** `/settings`

**UI Elements & Components:**

* Page title ("Account Settings")
* Tabbed sections: Profile \| Security \| Preferences
* **Profile Tab:**
    * Avatar/profile picture upload
    * Full name edit field
    * Email display (read-only if OAuth user)
    * "Save Changes" button
* **Security Tab:**
    * Current password field
    * New password field
    * Confirm new password field
    * "Update Password" button (hidden for OAuth-only users)
* **Preferences Tab:**
    * Dark mode toggle
    * Notification preferences (if applicable)
    * Account deletion option with confirmation modal
* Success and error toast notifications for all save actions

**Navigation:**

* Accessible via sidebar or user avatar dropdown
* Account deletion → logs out and redirects to `/`

***

### 5.13 404 Not Found Page

**Route:** `*` (catch-all)

**UI Elements & Components:**

* Large "404" display
* Friendly error message ("This page doesn't exist or has been moved.")
* "Go to Dashboard" button (for authenticated users) or "Go Home" button (for guests)
* PDF2Course logo

**Navigation:**

* CTA button → `/dashboard` or `/`

***

## 6\. App Menu and Navigation Structure

### Navigation System

PDF2Course uses a **dual navigation model** combining a **top navigation bar** (for global actions) and a **collapsible left sidebar** (for primary section navigation), which is a standard pattern for productivity and learning web applications.

### Top Navigation Bar (Global — Always Visible)

* **Left:** PDF2Course logo (links to `/dashboard` for authenticated users, `/` for guests)
* **Center:** Global search bar (triggers search overlay or navigates to `/search`)
* **Right:** Notification bell (future), User avatar with dropdown menu:
    * Profile
    * Settings (`/settings`)
    * Log Out

### Left Sidebar Navigation (Authenticated Users Only)

The sidebar is the primary navigation mechanism for authenticated users and contains:

```
📊 Dashboard          → /dashboard
📚 My Courses         → /dashboard (courses section)
⬆️ Upload PDF         → /upload
🕐 History            → /history
⚙️ Settings           → /settings
```

* The sidebar is collapsible on desktop to maximize content reading area.
* On mobile/tablet viewports, the sidebar transforms into a hamburger menu that slides in as a drawer overlay.
* The active route is highlighted in the sidebar.

### In-Course Navigation (Lesson Viewer)

Within the course lesson viewer, a secondary **left panel serves as the course curriculum navigator**:

* Hierarchical list of all chapters, topics, and lessons
* Collapsible by chapter
* Active lesson highlighted
* Lesson completion status icons

### Navigation Hierarchy Summary

```
/ (Landing)
├── /register
├── /login
│   └── /forgot-password
└── /dashboard (authenticated root)
    ├── /upload
    ├── /course/:courseId (Course Overview)
    │   ├── /course/:courseId/lesson/:lessonId (Lesson Viewer)
    │   └── /course/:courseId/quiz/:chapterId (Quiz)
    ├── /history
    ├── /settings
    └── /search
```

***

## 7\. User Flow

### Complete End-to-End User Journey

**Step 1 — Discovery & Registration**

1. A new user visits the PDF2Course landing page at `/`.
2. The user reads the hero section explaining the platform's value proposition.
3. The user clicks "Get Started" and is directed to `/register`.
4. The user fills in their name, email, and password, or clicks "Continue with Google."
5. Upon successful registration, Supabase Auth creates the user account and the user is automatically redirected to `/dashboard`.

***

**Step 2 — Onboarding on Dashboard**
6\. The user lands on the dashboard and sees an empty state with no courses yet\.
7\. A prominent CTA card and sidebar link invite the user to upload their first PDF\.
8\. The user clicks "Upload PDF" and is navigated to `/upload`.

***

**Step 3 — PDF Upload**
9\. On the upload page\, the user drags and drops \(or browses to select\) a PDF file — for example\, a machine learning textbook\.
10\. The system validates the file \(type and size\) and displays a preview card with the file name and size\.
11\. The user clicks "Generate Course\."
12\. The upload page transitions to a processing status screen showing animated progress and step\-by\-step status messages \(e\.g\.\, "Extracting content\.\.\."\, "Building course structure\.\.\."\, "Generating lessons\.\.\."\)\.
13\. Supabase real\-time updates push progress notifications to the frontend\.

***

**Step 4 — Course Generated**
14\. Once AI processing is complete\, the user is automatically redirected to the Course Overview page at `/course/:courseId`.
15\. The user sees the generated course with its title\, description\, difficulty level \(e\.g\.\, Intermediate\)\, estimated learning time\, learning objectives\, and prerequisites\.
16\. The user browses the Curriculum tab to see the full table of contents with all chapters and lessons\.

***

**Step 5 — Starting a Lesson**
17\. The user clicks on the first lesson in Chapter 1 from the Curriculum tab\.
18\. The user is navigated to `/course/:courseId/lesson/:lessonId`.
19\. The lesson viewer displays the lesson content: an explanation of the concept\, an Important Notes callout\, Key Takeaways\, a Real\-World Example\, and a Lesson Summary\.
20\. The user reads through the lesson at their own pace\.
21\. Once finished\, the user clicks "Mark as Complete" — the lesson is marked with a checkmark in the sidebar curriculum and overall progress updates\.
22\. The user clicks "Next Lesson" to proceed to the following lesson\.

***

**Step 6 — Using the AI Learning Companion**
23\. Mid\-lesson\, the user encounters a concept they don't understand\.
24\. The user clicks the "Ask AI" button in the top bar\, and the AI companion drawer slides open from the right\.
25\. The user types: "Can you explain gradient descent in simpler terms?"
26\. The AI responds with a tailored explanation scoped to the uploaded document's content\.
27\. The user follows up: "Give me a real\-world analogy\."
28\. The AI provides an analogy\. The user clicks the quick\-action button "Quiz me on this lesson\."
29\. The AI generates a short quiz question in the chat\. The user answers and the AI provides feedback\.
30\. The user closes the AI drawer and continues reading\.

***

**Step 7 — Taking a Chapter Quiz**
31\. After completing all lessons in Chapter 1\, the user navigates back to `/course/:courseId` and selects the "Quizzes" tab.
32\. The user clicks "Take Quiz" for Chapter 1\.
33\. The user is navigated to `/course/:courseId/quiz/:chapterId`.
34\. The user answers 10 questions: a mix of MCQ\, True/False\, and short\-answer questions\.
35\. The user clicks "Submit Quiz\."
36\. The results screen displays a score of "8/10 — 80%" with a green pass indicator\.
37\. The user reviews each question with the correct answer highlighted and an explanation provided\.
38\. The user clicks "Back to Course" to continue with Chapter 2\.

***

**Step 8 — Resuming Learning Later**
39\. The user closes the browser and returns the next day\.
40\. The user logs in at `/login` and lands on `/dashboard`.
41\. The "Continue Learning" section displays the machine learning course with a "Resume" button\.
42\. The user clicks "Resume" and is taken directly to the next incomplete lesson\.

***

**Step 9 — Searching Within a Course**
43\. The user wants to jump to a specific topic on "neural networks" without scrolling the sidebar\.
44\. The user clicks the search icon in the top bar and types "neural networks\."
45\. The search results page displays matching lessons and topics across the course\.
46\. The user clicks a result and is taken directly to the relevant lesson in the viewer\.

***

**Step 10 — Reviewing History & Completing the Course**
47\. After completing all lessons and quizzes\, the user visits `/history`.
48\. The History page shows the uploaded PDF\, the generated course \(100% complete\)\, all quiz attempts with scores\, and all AI chatbot conversations\.
49\. The user navigates back to `/dashboard` and sees the course card reflecting a "Completed" status with a 100% progress ring.
50\. The user is ready to upload another PDF and begin a new course\, repeating the flow from Step 3\.

***

**Step 11 — Account Management**
51\. At any time\, the user can access `/settings` via the sidebar or the avatar dropdown.
52\. The user can update their name\, change their password\, toggle dark mode\, or delete their account\.
53\. Saving changes triggers a success toast notification confirming the update\.



## Non-Functional Requirements

The application should satisfy the following quality requirements:

- Performance: Efficient handling of multi-page PDF documents and responsive interactions.
- Reliability: Consistent generation of courses and persistence of user progress.
- Security: User information and uploaded documents should remain protected and isolated.
- Scalability: The application should support increasing numbers of users and uploaded documents.
- Usability: The interface should be intuitive for learners with minimal training.
- Accessibility: The application should be usable across common desktop and mobile browsers.
- Maintainability: The product should be designed to support future enhancements and maintenance.

## Technology Requirements

The product supports the following technologies as specified in the project requirements. These are supported options and not implementation decisions.

Frontend
- React
- Next.js
- Tailwind CSS
- shadcn/ui (optional)

Backend
- FastAPI (Preferred)
- Node.js (Express or NestJS)

Database
- PostgreSQL
- Supabase
- MongoDB Atlas
- Neon PostgreSQL

AI Providers
- OpenRouter
- NVIDIA NIM
- Groq
- Hugging Face Inference API

Deployment
- Vercel
- Render
- Railway
- Fly.io
- Koyeb
- Northflank

## Assumptions and Constraints

- The application processes PDF documents.
- Generated learning content is based on the uploaded PDF.
- Each user's data, learning progress, and history should remain private.
- Learning progress should persist across user sessions.
- The application should support both desktop and mobile devices.

## Success Criteria

The product will be considered successful when users can:

- Authenticate securely.
- Upload PDF documents.
- Generate structured AI-powered learning courses.
- Learn through organized chapters and lessons.
- Track and resume learning progress.
- Interact with the AI learning companion.
- Attempt AI-generated quizzes.
- Search course content.
- Access learning history.
- Use the application effectively on desktop and mobile devices.

## Future Considerations

The following enhancements are optional and align with the internship assignment's bonus features:

- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Vector Database Integration
- Flashcards
- AI-generated Mind Maps
- Course Certificates
- Audio Narration
- Dark Mode
- PDF Summarization
- Multi-language Support
- Streaming Chat Responses
- Course Export
- Markdown Rendering
- AI-generated Diagrams

## Conclusion

PDF2Course aims to transform static PDF-based learning into an intelligent, structured, and interactive educational experience. This document establishes the product requirements and expected functionality while leaving implementation decisions to a separate Software Design Document.
