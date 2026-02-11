import type { Request } from 'express';

// RequestContext, her HTTP isteği için tenant (hesap) bilgisini ve
// ileride eklenecek diğer context alanlarını taşımak için kullanılır.
// Örneğin gelecekte requestId, userId, locale vb. alanlar eklenebilir.
export interface RequestContext {
  /**
   * Zorunlu tenant kimliği. Tüm domain operasyonları bu accountId ile scope edilir.
   */
  accountId: string;
}

// accountScope middleware'inden sonra çalışan handler'lar için,
// context'in gerçekten dolu olduğunu ifade eden yardımcı tip.
// Böylece bu handler'lar içinde accountId optional değilmiş gibi kullanılabilir.
export type ScopedRequest = Request & {
  context: RequestContext;
};

// Express Request tipini, RequestContext taşıyacak şekilde genişletiyoruz.
// Bu sayede controller katmanında `req.context?.accountId` erişimi tip güvenli hale gelir.
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * İstek bazlı context nesnesi. accountId zorunludur, diğer alanlar isteğe bağlı eklenebilir.
     */
    context?: RequestContext;
  }
}


