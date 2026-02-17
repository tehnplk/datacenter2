import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="DRGs: CMI"
      description="ดัชนี Case Mix Index (CMI) ในภาพรวม และแยกตามหน่วยบริการ"
      notes={[
        "แนะนำให้แสดง CMI รายเดือน/ไตรมาส + เทียบปีที่ผ่านมา",
        "สามารถเพิ่มตัวกรอง: โรงพยาบาล, สิทธิการรักษา, DRG Version",
      ]}
    />
  );
}
