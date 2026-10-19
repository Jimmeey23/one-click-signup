import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRespondIoContactBody,
  buildRespondIoWelcomeTemplateMessage,
  webhookCenterForLocationId,
} from "./momence.functions.ts";

describe("respond.io contact body", () => {
  it("fills every matching custom field by slug from the submission", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phoneE164: "+919876543210",
      center: "Kwality House, Kemps Corner",
      homeLocationId: 9030,
      classType: "power-cycle",
      waiverAccepted: true,
      memberId: 42,
      sourceId: "8082",
      utmSource: "instagram",
      utmMedium: "paid",
      utmCampaign: "oct",
      landingPage: "https://trial.physique57india.com/",
      stage: "completed",
    });

    assert.deepEqual(body, {
      firstName: "Asha",
      lastName: "Rao",
      email: "asha@example.com",
      phone: "+919876543210",
      custom_fields: [
        { name: "contact_email", value: "asha@example.com" },
        { name: "trial_name", value: "Asha Rao" },
        { name: "trial_phone", value: "+919876543210" },
        { name: "trial_location", value: "Kwality House, Kemps Corner" },
        { name: "center", value: "Kemps Corner, Mumbai" },
        { name: "class_type", value: "powerCycle" },
        { name: "member_id", value: "42" },
        { name: "MemberId", value: "42" },
        { name: "event_id", value: "completed_42" },
        { name: "lead_source", value: "instagram" },
        { name: "source_id", value: "8082" },
        { name: "landing_page", value: "https://trial.physique57india.com/" },
        { name: "utm_source", value: "instagram" },
        { name: "utm_medium", value: "paid" },
        { name: "utm_campaign", value: "oct" },
        { name: "whatsapp_consent", value: "not_opted_in" },
      ],
    });
  });

  it("carries Juniors child details and leaves out list values respond.io lacks", () => {
    const body = buildRespondIoContactBody({
      firstName: "Asha",
      lastName: "Rao",
      email: "Asha@Example.com",
      phoneE164: "+919876543210",
      center: "Physique 57 India",
      classType: "Physique 57 Juniors",
      waiverAccepted: true,
      childName: "Mira Rao",
      childAge: "8",
      batch: "Sat 10am",
      sourceForm: "kids-trial-form",
    });
    const fields = Object.fromEntries(body.custom_fields.map((f) => [f.name, f.value]));

    assert.equal(fields.center, undefined);
    assert.equal(fields.class_type, undefined);
    assert.equal(fields.child_name, "Mira Rao");
    assert.equal(fields.child_age, 8);
    assert.equal(fields.batch_preference, "Sat 10am");
    assert.equal(fields.source_form, "kids-trial-form");
    assert.equal(fields.event_id, "completed_asha@example.com");
  });
});

describe("respond.io welcome template", () => {
  it("sends the Mumbai template with the first name by default", () => {
    assert.deepEqual(buildRespondIoWelcomeTemplateMessage({ firstName: "Asha" }, 527665), {
      channelId: 527665,
      message: {
        type: "whatsapp_template",
        template: {
          name: "welcome_n1_mumbai",
          languageCode: "en",
          components: [{ type: "body", parameters: [{ type: "text", text: "Asha" }] }],
        },
      },
    });
  });

  it("picks the Bengaluru template from the studio or the landing page", () => {
    const byStudio = buildRespondIoWelcomeTemplateMessage(
      { firstName: "Asha", homeLocationId: 22116 },
      1,
    );
    const byLanding = buildRespondIoWelcomeTemplateMessage(
      { firstName: "Asha", abVariant: "bengaluru" },
      1,
    );
    assert.equal(byStudio.message.template.name, "welcome_n1_bengaluru");
    assert.equal(byLanding.message.template.name, "welcome_n1_bengaluru");
  });
});

describe("Bengaluru webhook center mapping", () => {
  it("uses the required center labels for every Bengaluru destination", () => {
    assert.equal(webhookCenterForLocationId(22116), "Kenkere House");
    assert.equal(webhookCenterForLocationId(36372), "The Studio - By Copper & Cloves");
    assert.equal(webhookCenterForLocationId(287883), "Plash Pilates");
  });
});
