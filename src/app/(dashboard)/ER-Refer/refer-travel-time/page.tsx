import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: เวลา Refer ต้นทาง → ปลายทาง"
      description="ระยะเวลาในการ refer จาก รพ.ต้นทาง ถึง รพ.ปลายทาง (เฉพาะรถ ambulance เคสฉุกเฉินสีเหลือง/ชมพู/แดง)"
      notes={[
        "แนะนำแสดง median / p90 + แผนที่/ระยะทาง (ถ้ามี)",
        "ต้องมีการคัดกรองเฉพาะเคส ambulance + color code",
      ]}
    />
  );
}
