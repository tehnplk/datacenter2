import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: อัตราตายโรควิกฤตสำคัญ"
      description="อัตราตายในโรควิกฤตสำคัญ (เช่น Sepsis, AMI) ที่ต้องได้รับการจัดการเตียงอย่างรวดเร็ว"
      notes={[
        "แนะนำแสดง mortality rate แยกโรค + trend",
        "ควรเชื่อมกับตัวแปรเวลาในการรอเตียง/การส่งต่อ",
      ]}
    />
  );
}
