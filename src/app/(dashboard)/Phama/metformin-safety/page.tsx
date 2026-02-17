import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="Phama: Metformin (MALA Prevention)"
      description="การจัดการความปลอดภัยในการใช้ยา Metformin (MALA Prevention)"
      notes={[
        "แนะนำตัวชี้วัด: eGFR ก่อนสั่งยา/การปรับขนาด/การหยุดยาในภาวะเสี่ยง",
        "ควรมี alert rule และรายงานผู้ป่วยเข้าเกณฑ์เสี่ยง",
      ]}
    />
  );
}
