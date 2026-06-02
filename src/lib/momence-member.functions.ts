import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { momenceFetch } from "./momence.server";

// Note: Momence's signable-documents endpoints are usually member-token scoped.
// We try the host equivalent first; on failure, callers should fall back to a
// generic waiver acceptance (we still capture signature text + consent client-side).

const MemberIdInput = z.object({ memberId: z.number().int().positive() });

export type SignableDocument = {
  id: number;
  name: string;
  description?: string | null;
  isSigned?: boolean;
  content?: string | null;
};

export const listSignableDocuments = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => MemberIdInput.parse(i))
  .handler(async ({ data }) => {
    try {
      const res = await momenceFetch<{ payload?: SignableDocument[] } | SignableDocument[]>(
        `/host/members/${data.memberId}/signable-documents`,
      );
      const docs = Array.isArray(res) ? res : (res.payload ?? []);
      return { documents: docs, available: true as const };
    } catch (e) {
      console.warn("listSignableDocuments failed:", e instanceof Error ? e.message : e);
      return { documents: [] as SignableDocument[], available: false as const };
    }
  });

const SignInput = z.object({
  memberId: z.number().int().positive(),
  documentId: z.number().int().positive(),
  signatureText: z.string().min(1).max(200),
});

export const signDocument = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SignInput.parse(i))
  .handler(async ({ data }) => {
    try {
      await momenceFetch(
        `/host/members/${data.memberId}/signable-documents/${data.documentId}/sign`,
        {
          method: "POST",
          body: JSON.stringify({ signature: data.signatureText }),
        },
      );
      return { signed: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign failed";
      console.warn("signDocument failed:", msg);
      return { signed: false as const, error: msg };
    }
  });

