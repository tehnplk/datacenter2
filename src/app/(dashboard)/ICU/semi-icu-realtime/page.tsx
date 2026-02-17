import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: เคส semi ICU → ICU (real time)"
      description="จำนวนเคสใน ward semi icu - icu แบบ real time"
      notes={[
        "แนะนำแสดงจำนวนผู้ป่วยปัจจุบัน + queue/risk category",
        "ต้องมี refresh interval และแหล่งข้อมูลแบบ near real-time",
      ]}
    />
  );
}
