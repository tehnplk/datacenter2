import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="DRGs: sum adjRW"
      description="ผลรวม Adjusted Relative Weight (adjRW) เพื่อสะท้อนภาระงานและความซับซ้อน"
      notes={[
        "แนะนำแสดง sum adjRW รายเดือน + แยกตามโรงพยาบาล",
        "ควรมีตัวกรองช่วงวันที่ และแหล่งข้อมูลการเข้ารหัส",
      ]}
    />
  );
}
