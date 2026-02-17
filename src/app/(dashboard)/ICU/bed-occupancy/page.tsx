import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: อัตราครองเตียง ICU & semi ICU"
      description="อัตราครองเตียง ICU และ semi ICU ของแต่ละโรงพยาบาล"
      notes={[
        "แนะนำแสดง occupancy (%) รายวัน/รายชั่วโมง และค่าเฉลี่ยรายเดือน",
        "ควรมีตัวกรอง: โรงพยาบาล, ประเภทเตียง (ICU/semi), ช่วงวันที่",
      ]}
    />
  );
}
