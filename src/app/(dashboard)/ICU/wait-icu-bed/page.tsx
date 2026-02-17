import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: ระยะเวลารอเตียง ICU (เฉลี่ย)"
      description="ระยะเวลาเฉลี่ยที่ผู้ป่วยวิกฤตต้องรอเตียง ICU"
      notes={[
        "แนะนำใช้ median / p90 มากกว่าค่าเฉลี่ย และแบ่งตามช่วงเวลา",
        "ต้องนิยาม timestamp: order/request ICU bed → admit ICU",
      ]}
    />
  );
}
