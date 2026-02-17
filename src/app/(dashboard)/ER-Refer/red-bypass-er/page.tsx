import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: วิกฤตสีแดง เข้าเฉพาะทางได้ทันที"
      description='อัตราผู้ป่วยวิกฤตสีแดง (เช่น STEMI, Stroke, Trauma) ที่เมื่อถึง ER ปลายทางแล้ว "ไม่ต้องแวะพักที่ ER" และเข้าห้องฉุกเฉินเฉพาะทาง (Cath Lab, Stroke Unit, OR) ได้ทันที'
      notes={[
        "แนะนำแสดง % ตามชนิดโรค + เหตุผลที่ไม่ผ่าน (ถ้ามี)",
        "ต้องนิยาม event timestamp: arrival → cath/OR/stroke unit",
      ]}
    />
  );
}
