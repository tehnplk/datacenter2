import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ERP: สรุปเตียงระดับจังหวัด"
      description="เตียงประเภท: รวม / แยกชาย-หญิง / ทั่วไป / พิเศษ / ICU / semi ICU + การครองเตียง และอัตราการครองเตียง (อิงรูปแบบ ERP)"
      notes={[
        "แนะนำมีตัวกรองช่วงวันที่: ตั้งแต่วันที่…ถึงวันที่…",
        "รูปแบบ: ตารางสรุป + chart occupancy ต่อประเภทเตียง",
      ]}
    />
  );
}
