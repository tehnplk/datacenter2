import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Pill,
  Scissors,
  Share2,
} from "lucide-react";

export type NavGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  items: Array<{
    id: string;
    label: string;
    href: string;
  }>;
};

export const DASHBOARD_NAV: NavGroup[] = [
  {
    id: "drgs",
    label: "RW/CMI",
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      { id: "cmi", label: "RW/CMI", href: "/RW-CMI/rw-cmi" },
      {
        id: "top-adjrw",
        label: "TOP 10 AdjRW",
        href: "/RW-CMI/top-adjrw",
      },
    ],
  },
  {
    id: "er-refer",
    label: "ER/Refer",
    icon: <Share2 className="h-4 w-4" />,
    items: [
      {
        id: "paperless",
        label: "Paperless Refer (อิเล็กทรอนิกส์ 100%)",
        href: "/ER-Refer/paperless",
      },
      {
        id: "top10",
        label: "Refer Out 10 อันดับ",
        href: "/ER-Refer/top10-cause",
      },
    ],
  },
  {
    id: "icu",
    label: "ICU",
    icon: <Activity className="h-4 w-4" />,
    items: [
      {
        id: "occupancy",
        label: "อัตราครองเตียง ICU & semi ICU (ราย รพ.)",
        href: "/ICU/bed-occupancy",
      },
      {
        id: "wait-bed",
        label: "ระยะเวลารอเตียง ICU (เฉลี่ย)",
        href: "/ICU/wait-icu-bed",
      },
      {
        id: "critical-mortality",
        label: "อัตราตายโรควิกฤตสำคัญ (Sepsis, AMI)",
        href: "/ICU/critical-mortality",
      },
      {
        id: "ward-deaths",
        label: "การตายใน ward ธรรมดา (Top 10)",
        href: "/ICU/ward-death-analysis",
      },
      {
        id: "icu-deaths",
        label: "การตายใน ICU / semi ICU (Top 10)",
        href: "/ICU/icu-death-analysis",
      },
    ],
  },
  {
    id: "or",
    label: "OR",
    icon: <Scissors className="h-4 w-4" />,
    items: [
      {
        id: "realtime",
        label: "จำนวนเคสผ่าตัดในห้อง OR (real time)",
        href: "/OR/realtime-cases",
      },
      {
        id: "utilization",
        label: "อัตราการใช้ห้องผ่าตัด",
        href: "/OR/utilization",
      },
      {
        id: "target-wait",
        label: "เวลารอผ่าตัด: ต้อกระจก, ไส้เลื่อน",
        href: "/OR/target-wait-time",
      },
    ],
  },
  {
    id: "phama",
    label: "Phama",
    icon: <Pill className="h-4 w-4" />,
    items: [
      {
        id: "moph-phr",
        label: "เชื่อมโยงข้อมูลยาผ่าน Moph-PHR",
        href: "/Phama/moph-phr-linkage",
      },
      {
        id: "metformin",
        label: "ความปลอดภัย Metformin (MALA Prevention)",
        href: "/Phama/metformin-safety",
      },
    ],
  },
  {
    id: "erp",
    label: "ERP",
    icon: <ClipboardList className="h-4 w-4" />,
    items: [
      {
        id: "beds",
        label: "เตียง: รวม/ชายหญิง/ทั่วไป/พิเศษ/ICU/semi + ครองเตียง",
        href: "/ERP/bed-summary",
      },
    ],
  },
];
