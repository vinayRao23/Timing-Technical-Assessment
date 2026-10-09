## What AI Tools Were Used For

AI tools were utilized throughout the development of the application to help with frontend/backend integration of PostgreSQL and the UI.
Generating React/Tailwind UI layout components for a light-theme design.
Drafting Node.js/Express REST endpoints (`/api/applications`, `/follow-ups`, `/assistant/confirm`) and creating 10 automated node-test unit/integration test cases covering timezone boundaries.
Formulating prompt-injection sanitization patterns for LLM message draft generation and timezone calendar calculations using `Intl.DateTimeFormat`.

## What the AI Got Wrong and how it was fixed

When generating the priority ranking endpoint (`GET /follow-ups/priority`), the AI initially included a `WHERE status != 'rejected'` SQL clause under the assumption that non-active applications should be ignored entirely.
During test suite verification for seed application `a3` (Rejected), the priority overview omitted the application completely rather than displaying it at the bottom with an explanation.
I caught the missing application during debugging, removed the restrictive `WHERE` clause, and updated the tier-based ranking algorithm to explicitly place rejected applications in the bottom tier with a written rationale explaining that the role is closed.

## What Was Not Delegated to AI

I chose not to delegate the multi-tenant resource access strategy to AI. Specifically, deciding whether cross-user resource access (e.g., User `u1` requesting User `u2`'s application `a6`) should return `403 Forbidden` or `404 Not Found`.
Returning `403 Forbidden` reveals that the resource exists (enabling resource ID attacks). I created the model to return `404 Not Found` whenever a user attempts to access data outside their ownership, ensuring that the data is secure.
