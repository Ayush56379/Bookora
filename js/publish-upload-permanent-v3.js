// Bookora publish upload runtime — retired.
// PublishInternalPageV2 is the single authoritative publish flow.
// The previous v3 runtime used /api/books/upload-session/*, which is intentionally
// disabled in the production backend. Keeping this file inert prevents a stale or
// cached runtime from installing a competing submit handler.
export {};