import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="DRGs: Top 10 กลุ่มโรค (CMI สูงสุด)"
      description="แสดง 10 อันดับกลุ่มโรคของแต่ละโรงพยาบาลที่มี CMI สูงสุด"
      notes={[
        "รูปแบบแนะนำ: ตาราง + bar chart (Top 10) ต่อโรงพยาบาล",
        "ควรมีตัวกรอง: โรงพยาบาล, ช่วงวันที่, กลุ่ม DRG/หมวด ICD",
      ]}
    />
  );
}
