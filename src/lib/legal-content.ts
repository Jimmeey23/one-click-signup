export type LegalSection = {
  title?: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
};

const businessIntro = [
  "Host: Physique 57 Mumbai",
  "Business: AMP Fitness LLP",
  "Address: Kwality House, 2nd Floor, August Kranti Marg, Kemps Corner, Mumbai - 400036",
  "Tax ID: 27ABGFA3922Q1Z2",
];

const releaseAndIndemnity = [
  'In connection with my enrolment and participation in the exercise class / program organised by AMP Fitness, LLP ("AMP") and use of the property, facilities and services provided to me by AMP ("Program"), I hereby, on behalf myself and my relatives, heirs, successors, executors and administrators, indemnify and agree to release, waive, discharge and agree and covenant to indemnify, release, waive, discharge and not to sue AMP, its designated partners, other partners, shareholders, directors, subsidiaries, affiliates, its and their licensees, licensors, successors, assigns, employees, officers, directors, consultants, service providers, agents, and contractors, and all persons, corporations, partnerships and other entities with which these entities may have become affiliated or may otherwise have dealings with at any time in the future, from any and all liability, claims, demands, actions and causes of action whatsoever arising out of or relating to any loss, expense, damages, injury, illnesses, diseases, disorders, conditions, disablement (whether partial, total, permanent or temporary), grievous bodily injury including death, that may be sustained by me, or to any property belonging to me, whether directly or indirectly caused to me by any person and on account of any reason whatsoever, whether by reason of due to my acts or omissions or by AMP or any of its instructors / operators, or otherwise as a result of participating in the Program.',
  "I am voluntarily participating in the Program with full knowledge, understanding and appreciation of the risks inherent in any physical exercise and expressly assume all risks of injury, illnesses, diseases, disorders, conditions and even partial or permanent disablement and/or death which could occur by reason of my participation.",
  "I have disclosed all relevant information regarding my physical, medical, emotional or mental conditions that could cause harm to me or others by participating in this Program and I hereby expressly declare, confirm and state that I have neither at any time suffered nor currently suffer nor am I susceptible to suffering any form of health condition which prevents or could prevent me, in any manner whatsoever, from participating in the Program in the manner as required by AMP.",
  "I am executing this Release cum Indemnity Agreement after having viewed or having had the opportunity to view the site of AMP's trial exercise classes; having reviewed the instructor's qualifications; having had the scope of AMP's classes and their associated risks fully explained to me; and after asking or having had an opportunity to ask questions regarding the classes and risks associated with AMP's exercise classes.",
  "I hereby further declare, confirm and state that I have all the requisite qualifications and minimum fitness requirements to enable me to participate in the Program. I agree that my safety is primarily my own responsibility. I agree to make sure that I know how to safely participate in the Program, and I agree to observe any and all rules, codes, guidelines, procedures, manuals and practices that may be required to minimize the risk of injuries, illnesses, diseases, disorders, conditions and even partial or permanent disablement and/or death whether or not such rules, codes, guidelines, procedures, manuals and practices are specifically and/or expressly conveyed to me.",
  "I acknowledge that I am fully aware and conversant with the precautions that I am required to take in connection with any and all physical activities whilst partaking in the activities forming a part of the Program. I agree to stop and seek assistance if I do not believe I can safely continue with the activities involved in the Program, to limit my participation in the said Program to reflect my personal fitness level, and to refrain from any and all actions that would pose any form of hazard to myself or others in the Program.",
  'The services provided by AMP to me under the Program are on an "as is" basis, without warranty of any kind, either expressed or implied, including without limitation any warranty for information services, coaching, uninterrupted access, or products and services provided through or in connection with the Program.',
  "All personal property carried by me and brought to AMP's premises or the Program is brought at my sole risks and consequences and AMP shall not, in any manner whatsoever, be liable for any loss or damage caused to the same during the Program.",
];

const privacyConsent = [
  'I consent to AMP collecting, storing, possessing, dealing, disclosing, transferring and otherwise handling my personal information including sensitive personal data or information ("personal information") for the purposes of my participating in the Programs.',
  "I agree to the terms of AMP's Privacy Policy with regard to all matters pertaining to my personal information. I understand that personal information provided by me will be held confidential unless agreed otherwise in writing or as may be required by applicable law.",
  "Additionally, I understand that the use of technology is not always secure and I accept the risks involved in the transmission, exchange and storage of confidential and personal information in and through various electronic means, including but not limited to in the use of email, text, phones, video conferencing facilities and other technology.",
];

const jurisdiction = [
  "The terms of this Agreement are governed by the laws of India and shall be subject to the exclusive jurisdiction of the courts at Mumbai.",
  "Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, and amendments thereto. The arbitration proceedings shall be conducted by a sole arbitrator to be mutually appointed by the parties. The seat, place and venue of the arbitration shall be Mumbai. The language of the arbitration shall be English only.",
  "This Release cum Indemnity Agreement shall be read in conjunction with the other application forms and documents executed between me and AMP in relation to the Program. By my signature, I acknowledge that I have read and fully understood and accept the terms of this Release cum Indemnity Agreement and represent and agree that my signature is freely and knowingly given.",
];

export const waiverDocument: LegalDocument = {
  title: "Waiver",
  subtitle: "Release cum Indemnity Agreement for Physique 57 Mumbai / AMP Fitness LLP.",
  updated: "Extracted from Waiver - 2025-03-18",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Age, Capacity, Health Declaration",
      paragraphs: [
        "I confirm and declare that I am an adult of at least 18 years of age or am represented by an adult parent or guardian of at least 18 years of age and competent to contract and participate in this exercise class / program.",
        "This informed consent is freely and voluntarily executed after fully understanding the contents thereof, not caused by coercion, undue influence, fraud, misinterpretation, or mistake and shall be binding upon me, my spouse, partner, parents / guardians, relatives, legal representatives, heirs, executors, administrators, successors and assignees.",
        "I confirm and declare that I am in adequate health to participate in any activities at the Studio(s) of AMP Fitness LLP and that I also do not have any illness, disease or other health condition which could potentially put me or anyone else at risk. I confirm and acknowledge that should this information or position change, it is my sole responsibility to promptly notify the instructors at the Studio(s) of AMP Fitness LLP.",
      ],
    },
    { title: "Release, Waiver, Assumption of Risk and Indemnity", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
    {
      title: "Class Policies",
      paragraphs: [
        "Any personal property brought to Classes is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
        "All cancellations must be given in writing to info@physique57india.com 12 hours prior to the class booking. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full or Express Studio Barre Class 10 minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Payments can be made online via our app, using a valid credit or debit card.",
        "All classes must be paid for in advance and are non-refundable.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "If the class is full, you will be placed on the waitlist; additions to the class from the waitlist will be on a first come, first served basis.",
        "Instructor requests will be subject to availability.",
        "Preferred date and class timings will be subject to availability.",
      ],
    },
  ],
};

export const membershipWaiverDocument: LegalDocument = {
  title: "Membership Waiver",
  subtitle:
    "Membership terms, release, privacy consent, and cancellation policies for Physique 57 Mumbai.",
  updated: "Extracted from Membership waiver - 2026-02-03",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Membership Access and Fees",
      paragraphs: [
        "In exchange for the Fees and during the Term of this agreement, you will have access to each Physique 57 location in Mumbai during regular studio hours and you will have the right to participate in instructional classes offered by the studio subject to availability. Services offered by the studio will include classes in the Physique 57 fitness technique.",
        "The Fees payable under the terms of this Agreement are for the period of time and are in no way related to your actual usage of the Studio facilities.",
        "For the avoidance of doubt, please note that you are not, under any circumstances whatsoever, entitled to receive a refund of the Fees or any part thereof, under this membership agreement.",
        "Physique 57 reserves the right to cancel this membership and terminate this agreement at any time in the event that the member engages in behaviour that is unsafe or objectionable to other members or Physique 57 Staff.",
        "You shall at all times comply with and be bound by the policies, rules and regulations of Physique 57, as framed and modified from time to time, in all matters, including relating to your access and use of Physique 57's facilities, equipment and generally in relation to the services being provided to you hereunder.",
      ],
    },
    {
      title: "Personal Property",
      paragraphs: [
        "Any personal property brought to a Physique 57 India Studio is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 India is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
      ],
    },
    { title: "Release, Waiver, Assumption of Risk and Indemnity", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
    {
      title: "Cancellation Policy",
      paragraphs: [
        "All cancellations must be given in writing to info@physique57india.com or via the Physique 57 India app at least 12 hours prior to the Scheduled Class Start time. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full Studio Barre class 10 minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients will be unable to join an Express Studio Barre class past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients who have attended under 10 powerCycle classes will need to be at the Studio at least 15 minutes before the Scheduled Class Start time. Entry to the Studio will be permitted until 5 minutes before the class start time.",
        "Clients who have attended over 10 Physique 57 classes need to be at the Studio 10 minutes before class starts. Entry to the room will not be permitted once the class has begun.",
      ],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  title: "Privacy Policy",
  subtitle:
    "Personal information consent terms from the attached Physique 57 Mumbai waiver documents.",
  updated: "Extracted from attached waiver documents",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Related Terms", paragraphs: jurisdiction },
  ],
};

export const termsDocument: LegalDocument = {
  title: "Terms and Conditions",
  subtitle:
    "Studio access, booking, cancellation, conduct, payment, and liability terms for Physique 57 India.",
  updated: "Aligned with Physique 57 India policy and waiver content",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Studio Access and Class Booking",
      paragraphs: [
        "Access to each class is strictly limited to available barre spots. Arriving without a prior booking is strongly discouraged.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "Preferred dates, class timings, and instructor requests are subject to availability.",
        "If a class is full, clients may be placed on the waitlist. Additions from the waitlist are handled on a first come, first served basis.",
      ],
    },
    {
      title: "Payment, Packages, and Memberships",
      paragraphs: [
        "All classes must be paid for in advance and are non-refundable.",
        "Single classes, class packages, unlimited memberships, workshops, special promotions, and memberships are strictly non-refundable and non-transferable.",
        "Unlimited memberships and class packages may not be shared between clients.",
        "The fees payable under a membership are for the membership period and are not related to actual usage of studio facilities.",
      ],
    },
    {
      title: "Cancellation and Late Cancellation",
      paragraphs: [
        "All cancellations for Studio Classes must be informed to the team via email, WhatsApp, or directly through the Physique 57 App at least 12 hours prior to the scheduled class start time.",
        "If a reservation is not cancelled within the required cancellation window, the reservation will be treated as a late cancellation.",
        "If a reservation under a single class or class package is not cancelled within the required cancellation window, the class will be deducted from the applicable package.",
        "Members on unlimited memberships are permitted a maximum of two late cancellations per calendar week. Upon a third late cancellation within the same calendar week, advance booking privileges may be suspended for seven days.",
      ],
    },
    {
      title: "Late Entry and Class Readiness",
      paragraphs: [
        "Physique 57 enforces a strict late entry policy to maintain class safety, structure, instructor flow, and the overall client experience.",
        "Members will ordinarily not be permitted entry into a class after 10 minutes from the scheduled class start time.",
        "For powerCycle, new clients with fewer than 10 classes must arrive 15 minutes before class for a safety briefing and custom bike fit. Entry is subject to studio discretion and operational feasibility.",
        "For express-format classes, entry will not be permitted once the class has commenced, and no grace period shall apply.",
      ],
    },
    {
      title: "Health, Safety, and Conduct",
      paragraphs: [
        "Clients are responsible for ensuring they are in adequate health to participate in classes and must promptly notify instructors if their health position changes.",
        "Clients agree to observe studio rules, codes, guidelines, procedures, and instructor directions intended to minimize risk and maintain a safe class environment.",
        "Physique 57 reserves the right to cancel a membership or restrict access if a member engages in unsafe or objectionable behaviour toward staff, instructors, or other members.",
      ],
    },
    { title: "Liability, Personal Property, and Privacy", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
  ],
};
