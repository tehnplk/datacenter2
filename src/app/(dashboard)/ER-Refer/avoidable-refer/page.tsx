import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: เคสที่ศักยภาพ รพช.เดิมทำได้"
      description='จำนวนเคสที่ส่งมาแล้วพบว่า "ศักยภาพ รพช. เดิมทำได้" (avoidable refer)'
      notes={[
        "แนะนำแสดงจำนวน/อัตรา ต่อเดือน + รายสาเหตุหลัก",
        "ต้องกำหนดเกณฑ์ประเมินศักยภาพ/แนวทาง clinical pathway",
      ]}
    />
  );
}
