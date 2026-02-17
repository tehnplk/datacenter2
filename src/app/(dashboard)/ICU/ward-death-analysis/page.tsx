import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: การตายใน ward ธรรมดา"
      description="สาเหตุการตาย 10 อันดับ + อัตราการตายรวม (Top 10) + อัตราการตายแยกโรค (Top 10)"
      notes={[
        "แนะนำแสดง Top 10 cause + rate ต่อ 1,000 admit (หรือมาตรฐานที่ตกลง)",
        "ควรมีตัวกรอง: โรงพยาบาล, ward type, ช่วงวันที่",
      ]}
    />
  );
}
