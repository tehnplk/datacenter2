import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="Phama: เชื่อมโยงข้อมูลยา (Moph-PHR)"
      description="การเชื่อมโยงข้อมูลยาผ่านระบบ Moph-PHR"
      notes={[
        "แนะนำแสดงจำนวนรายการยาที่ sync ได้สำเร็จ + error rate",
        "ควรมีตัวกรอง: โรงพยาบาล, ช่วงวันที่, ประเภทยา",
      ]}
    />
  );
}
