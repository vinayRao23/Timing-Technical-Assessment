## General Overview of Project

1. How to Run the Project & Tests:  
   Backend commands (node seed.js, node server.js).  
   Frontend commands (npm run dev -- --port 3000, npm run build).  
   Test suite execution (node --test server.test.js running 10 automated tests).
2. Key Design Decisions:  
   Multi-tenant data isolation (X-User-Id header enforcement with 404 responses on cross-user attempts).  
   Timezone-aware follow-up calculations (Intl.DateTimeFormat with IANA timezones and reference time now).  
   Priority Ranking hierarchy with written explanations.  
   Assistant Tool layer with Two-Phase Confirmation.  
   Untrusted data escaping for prompt-injection safety in message generation.
3. Assumptions Made:
   Default reference timestamp 2026-10-03T16:00:00Z.  
   Maya (u1, America/New_York) single-user UI session. You can switch to Kenji by making them the default user in the seed data, but for the purpose of this application I have made Maya the default user in order to prioritize security and the user experience.  
   There are 7-day follow-up interval defaults.
4. Future Improvements with More Time:
   Google Gemini API integration for live message generation.  
   Real-time WebSockets sync.
   Drag-and-drop column reordering.
   JSON Web Token / OAuth 2.0 authentication.

## Potential Edge Cases

### Date & Timezone

Malformed Dates: Handled cleanly without crashing (e.g. "2026-13-40" returns 400 Bad Request).  
Missing Activity Dates: Prevents null reference errors and suppresses false overdue alerts.  
Month/Leap Boundaries: Accurately computes intervals across month and leap year boundaries without date drift.  
Timezone Isolation: Calculates follow-up due dates relative to user IANA timezones instead of server UTC.  
Custom Reference Time (now): Supports time-travel parameter testing without modifying stored database timestamps.

### Multi-Tenant Security

Missing User Header: Requests without X-User-Id return 400/401 Unauthorized.  
Cross-User Isolation: Accessing another user's application returns 404 Not Found to prevent resource enumeration.  
Ownership Tampering: Enforces header identity to block creating or mutating records owned by other users.

### Data Security

Prompt Injection Defense: Treats notes as untrusted raw text, escaping prompt injection attacks in AI drafts.  
Missing Recruiter Notes: Gracefully defaults greetings without hallucinating false names or interview details.

### Application and Lifecycle

Rejected Applications: Excluded from overdue follow-up alerts, but ranked at lowest priority with explanation.  
Looming Offer Deadlines: Takes top (#1) priority ahead of active interviews.  
Ranking Tie-Breaking: Uses secondary deterministic sorting (days to deadline or ID) for stable rankings.

### Assistant Automation

Two-Phase Confirmation: Write actions return uncommitted proposals requiring explicit user confirmation.  
Replay Prevention: Duplicate confirmation attempts on the same proposal ID return 400 Bad Request.  
Invalid Proposal IDs: Non-existent or expired proposals return 404 Not Found.

### System & Inputs

Empty Datasets: Requests on 0 applications return empty arrays metrics without UI crashes.  
Missing Payload Fields: Requests missing required fields (company, role) return 400 Bad Request.

## Ranking Justification

1. Offers (offer): Offers are the ultimate goal of job searching. Failing to reply before an offer deadline risks losing the offer entirely.
2. Active Interviewing with Overdue Follow-up: Following up keeps recruiter interest alive.
3. Applied with Overdue Follow-up: Unanswered applications need to be follow-upped on so that they don't go to waste.
4. Active Pipeline On Schedule: Ongoing applications progressing normally.
5. Saved Drafts: Bookmarked opportunities not yet submitted.

## Potential Failure Cases

Company Preference Disconnect: A user might prioritize a saved or applied role at their dream company over a pending offer at a safety company.  
Off-Platform State: The candidate accepted an offer or withdrew verbally off-platform without updating status in the system.  
External Recruitment: Recruiter calls/emails occurred off-platform, making the automated overdue follow-up unnecessary.

## How to Detect Failure Cases

Track if users consistently click or edit Rank #3 or #4 items before Rank #1.  
Manual Drag-and-Drop Override: Monitor when users manually re-order cards on the board to feed user preference back into the ranking engine.

## Flow of Read/Write Tools

Read Request: The Assistant calls listFollowUps to check current status. Data is fetched from PostgreSQL.  
Action Proposal: The user asks to snooze an application. The Assistant calls snoozeFollowUp("a1", 3) as an example. The backend calculates proposed state changes and generates a proposalId, but does NOT touch the database.  
User Review: The Assistant presents the proposed summary and state diff to the user with "Confirm" and "Cancel" buttons.  
Execution: When the user clicks "Confirm", the Assistant calls confirmProposal(proposalId). The backend verifies the proposal and applies the SQL mutation to PostgreSQL.

## Diagram

Image Link: "/FlowChart.png"

## Automated Tests

Can be found in "/backend/server.test.js"
