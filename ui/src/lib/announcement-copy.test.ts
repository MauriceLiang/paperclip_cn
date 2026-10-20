import { expect, it } from "vitest";
import type { Announcement } from "@paperclipai/shared";
import { announcementForDisplay } from "./announcement-copy";

const connectorsAnnouncement: Announcement = {
  id: "2026-09-14-connectors",
  eyebrow: "Introducing Connectors",
  title: "Give your agents the access they need",
  description: "Connect Gmail, GitHub, Notion, and more. Choose which agents get access, which accounts they use, and which actions they can take.",
  image: {
    path: `assets/${"0".repeat(64)}.png`,
    alt: "Paperclip agents with their own sets of connected apps.",
  },
  primaryAction: { kind: "route", label: "Explore connectors", path: "/apps" },
};

it("localizes the known first-party connectors announcement while preserving its action", () => {
  const localized = announcementForDisplay(connectorsAnnouncement, (key) => `zh:${key}`);

  expect(localized).toMatchObject({
    id: connectorsAnnouncement.id,
    eyebrow: "zh:announcementCopy.connectors.eyebrow",
    title: "zh:announcementCopy.connectors.title",
    description: "zh:announcementCopy.connectors.description",
    image: { path: connectorsAnnouncement.image!.path, alt: "zh:announcementCopy.connectors.imageAlt" },
    primaryAction: { kind: "route", label: "zh:announcementCopy.connectors.primaryAction", path: "/apps" },
  });
});

it("leaves other remote announcements unchanged", () => {
  const announcement = { ...connectorsAnnouncement, id: "future-announcement" };
  expect(announcementForDisplay(announcement, (key) => key)).toBe(announcement);
});
