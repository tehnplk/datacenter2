import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: เวลา Consult → ตอบรับแผนการรักษา"
      description="ระยะเวลาตั้งแต่ ER รพช. กดปุ่ม Consult จนถึงแพทย์เฉพาะทาง รพ.พุทธชินราช/รพ.แม่ข่าย ตอบรับแผน"
      notes={[
        "แนะนำแสดง median / p90 และแจกแจงตามช่วงเวลา (กะ/วันหยุด)",
        "ตัวกรอง: โรงพยาบาลต้นทาง, ปลายทาง, ประเภทโรค, triage",
      ]}
    />
  );
}
