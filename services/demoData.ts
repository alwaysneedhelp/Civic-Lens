import { SummaryResult } from '../types';

export const DEMO_VIDEO_SUMMARY: SummaryResult = {
  sourceType: 'video',
  title: "City Council Meeting - Budget & Infrastructure Update",
  overview: "The council reviews progress on three active civic projects: the Community Park renovation, the Downtown Bike Lane extension, and the Main Library solar installation.",
  points: [
    {
      locator: "00:05",
      point: "The speaker states $500,000 has been fully allocated to the Community Park renovation this quarter."
    },
    {
      locator: "00:22",
      point: "The Downtown Bike Lane extension is announced as completed last month."
    },
    {
      locator: "00:45",
      point: "The library roof solar panel installation is moving forward with a contractor selected."
    },
    {
      locator: "01:10",
      point: "The new school wing construction timeline is described as roughly on track."
    }
  ]
};

export const DEMO_YOUTUBE_SUMMARY: SummaryResult = {
  sourceType: 'youtube',
  title: "City Council Meeting Livestream - Q1 Recap",
  overview: "The recorded livestream covers the council's review of the Community Park renovation budget, the Downtown Bike Lane extension, and the library solar panel project.",
  points: [
    {
      locator: "02:14",
      point: "The chair confirms $500,000 was allocated to the Community Park renovation this quarter."
    },
    {
      locator: "07:41",
      point: "A council member reports the Downtown Bike Lane extension was completed last month."
    },
    {
      locator: "15:03",
      point: "Staff confirm the library roof solar installation is moving forward with a contractor selected."
    }
  ]
};

export const DEMO_PDF_SUMMARY: SummaryResult = {
  sourceType: 'pdf',
  title: "Quarterly Budget & Infrastructure Report",
  overview: "The official report documents partial funding for the Community Park renovation, an in-progress bike lane extension, and a pending state grant application.",
  points: [
    {
      locator: "Page 3",
      point: "Budget Item 4.2: Community Park Renovation is allocated $50,000 for the Q1 planning phase only."
    },
    {
      locator: "Page 1",
      point: "The Downtown Bike Lane extension is listed as 80% complete, with completion expected next month."
    },
    {
      locator: "Page 5",
      point: "The Main Library Solar Installation has a contractor selected; work is pending weather."
    },
    {
      locator: "Page 4",
      point: "The State Grant covering remaining project costs is listed as an application still pending."
    }
  ]
};
