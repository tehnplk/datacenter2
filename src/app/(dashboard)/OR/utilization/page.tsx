import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="OR: อัตราการใช้ห้องผ่าตัด"
      description="อัตราการใช้ห้องผ่าตัด (utilization)"
      notes={[
        "แนะนำตัวชี้วัด: hours used / hours available, cancellation rate",
        "แนะนำแสดง trend รายเดือน + แยกตามห้อง/กลุ่มศัลยกรรม",
      ]}
    />
  );
}
