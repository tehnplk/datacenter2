import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="OR: ระยะเวลารอคอยผ่าตัด (โรคเป้าหมาย)"
      description="ระยะเวลารอคอยผ่าตัดในกลุ่มโรคเป้าหมาย: ต้อกระจก, ไส้เลื่อน"
      notes={[
        "แนะนำแสดง waiting time median/p90 แยกตามโรคและสถานพยาบาล",
        "ต้องนิยามวันที่เริ่มนับ: diagnose/decision → operation date",
      ]}
    />
  );
}
