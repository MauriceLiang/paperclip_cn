import type { Announcement } from "@paperclipai/shared";

type Translate = (key: string) => string;

const CONNECTORS_ANNOUNCEMENT_ID = "2026-09-14-connectors";

/** Localize first-party feed copy without changing the announcement payload. */
export function announcementForDisplay(announcement: Announcement, t: Translate): Announcement {
  if (announcement.id !== CONNECTORS_ANNOUNCEMENT_ID) return announcement;
  return {
    ...announcement,
    eyebrow: t("announcementCopy.connectors.eyebrow"),
    title: t("announcementCopy.connectors.title"),
    description: t("announcementCopy.connectors.description"),
    ...(announcement.image
      ? { image: { ...announcement.image, alt: t("announcementCopy.connectors.imageAlt") } }
      : {}),
    primaryAction: {
      ...announcement.primaryAction,
      label: t("announcementCopy.connectors.primaryAction"),
    },
  };
}
