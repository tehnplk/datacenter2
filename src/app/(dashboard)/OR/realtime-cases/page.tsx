import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="OR: เคสผ่าตัด (real time)"
      description="จำนวนเคสผ่าตัดในห้อง OR แบบ real time"
      notes={[
        "แนะนำแสดงสถานะห้อง/คิวผ่าตัด + refresh ทุก 1-5 นาที",
        "ตัวกรอง: โรงพยาบาล, ประเภทห้อง, elective/emergency",
      ]}
    />
  );
}
