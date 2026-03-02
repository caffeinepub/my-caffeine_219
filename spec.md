# Specification

## Summary
**Goal:** Stabilize the backend and frontend of the 邓氏家族族谱 app by removing all authorization guards from backend functions, fixing Candid return types, and ensuring mutations are properly handled and reflected in the UI.

**Planned changes:**
- Remove all admin-only and user-only authorization guards from every mutating function in `backend/main.mo` so calls from any principal return `#ok` instead of an "Unauthorized" error
- Add explicit `Result<T, Text>` return type annotations to all listed update functions in `backend/main.mo` to prevent Candid decoding mismatches
- Fix all mutation hooks in `frontend/src/hooks/useQueries.ts` to properly await actor calls, check `#ok`/`#err` arms, and throw on `#err` so React Query surfaces failures correctly
- After every successful mutation in the relevant page components, invalidate the corresponding React Query cache keys so the UI reflects changes immediately without a manual refresh
- Add `adminNote?: string` to the `HelpRequest` TypeScript type, fix the `useAddHelpRequestNote` mutation hook, display `adminNote` on help request rows in `ContactClan.tsx`, and add an inline "Add Note" form gated behind the upload passcode modal

**User-visible outcome:** All create, update, and delete operations across people, manuscripts, family history, activities, posts, contacts, donations, and help requests work without authorization errors, and the UI immediately reflects changes after any successful mutation.
