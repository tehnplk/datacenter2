import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: Paperless Refer"
      description="ร้อยละของเคส Refer ที่ส่งข้อมูลผ่านระบบอิเล็กทรอนิกส์ครบถ้วน (เป้าหมาย 100%)"
      notes={[
        "แนะนำแสดง % รายวัน/เดือน + แยกตามโรงพยาบาลต้นทาง",
        "นิยาม: เคส refer ที่มีเอกสารครบในระบบอิเล็กทรอนิกส์ (ไม่มี paper)",
      ]}
    />
  );
}
