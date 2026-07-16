import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WHATSAPP_PHONE,
  SUPREME_HQ_BANDRA_WHATSAPP_PHONE,
  whatsappPhoneForLocationId,
} from "./whatsapp-contact.helpers.ts";

describe("WhatsApp contact helpers", () => {
  it("uses the Bandra number for Supreme HQ and the default number elsewhere", () => {
    assert.equal(whatsappPhoneForLocationId(29821), SUPREME_HQ_BANDRA_WHATSAPP_PHONE);
    assert.equal(SUPREME_HQ_BANDRA_WHATSAPP_PHONE, "919769570037");

    assert.equal(whatsappPhoneForLocationId(9030), DEFAULT_WHATSAPP_PHONE);
    assert.equal(DEFAULT_WHATSAPP_PHONE, "919769665757");
  });
});
