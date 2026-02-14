import type { Request } from 'express';

/**
 * RequestContext carries tenant (account) information and potentially
 * other context fields for each HTTP request.
 * Future fields like requestId, userId, locale etc. can be added here.
 */
export interface RequestContext {
  /**
   * Mandatory tenant ID. All domain operations are scoped by this accountId.
   */
  accountId: string;
}

/**
 * A helper type for handlers running after the accountScope middleware,
 * indicating that the context is guaranteed to be present.
 * This allows using accountId without optional checks in those handlers.
 */
export type ScopedRequest = Request & {
  context: RequestContext;
};

// Extend Express Request type to carry RequestContext.
// This makes `req.context?.accountId` access type-safe in the controller layer.
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Request-based context object. accountId is required, other fields can be optional.
     */
    context?: RequestContext;
  }
}


