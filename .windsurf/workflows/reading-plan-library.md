---
description: Launch the Reading Plan digital library admin console
---
1. **Inspect requirements**  
   - Confirm the scope: global resource library (categories, metadata, attachments) + AI Reading Coach.  
   - Re-read the last spec from the user to ensure no detail is missed.

2. **Set up collection constants**  
   - Update `lib/firestore-collections.ts` with any missing collections (`reading_resources`, `resource_categories`, etc.).  
   - Commit this separately if other tasks are in progress.

3. **Create Firestore services**  
   - Add `ResourceLibraryService` for CRUD on resources and categories (`lib/services/resource-library-service.ts`).  
   - Include helpers for pagination, filtering by category, and attachment references.

4. **Design admin pages**  
   - Build a top-level admin route (e.g., `/admin/reading-library`).  
   - UI sections: stats overview, categories manager, resource list + filters, upload modal, attachment drawer.  
   - Use existing UI components/utilities for consistency.

5. **Implement upload flow**  
   - Reuse or extend `StorageService` for large PDF/EPUB uploads (50MB+).  
   - Add API route `/api/reading-library/resources` with POST (multipart), GET (list), PUT/PATCH (metadata), DELETE.  
   - Ensure form handles title, description, author, category, tags, plan connections.

6. **Attach resources to plans**  
   - Provide UI hook from Reading Plan detail to select/link resources from the global library.  
   - Update `/api/reading-plans/[planId]/day/[dayNumber]` to accept linked resource IDs.

7. **AI Reading Coach**  
   - Verify DeepSeek API key in env.  
   - Add backend route `/api/reading-coach/chat` that proxies to DeepSeek with conversation context (plan info, reading day).  
   - Implement daily nudge scheduler (server cron or background job) that posts notifications or emails.  
   - Build frontend coach panel (chat interface + insights + quick actions).

8. **Testing & deployment**  
   - Run `npm run lint && npm run test` (if available) plus `npm run build`.  
   - Deploy to Vercel (`vercel --prod`).  
   - Smoke-test uploads, resource linking, AI coach chat, and daily nudges in production.
