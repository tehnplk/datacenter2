import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ER/Refer: Top 10 ประเภท/รหัส/สาเหตุ Refer in/out"
      description="สรุป 10 อันดับแรกของประเภทโรค รหัสโรค และสาเหตุการ refer (refer in / refer out)"
      notes={[
        "แนะนำแยกแท็บ: Refer in vs Refer out",
        "แนะนำแสดง Top 10 ICD10/diagnosis group + count + %",
      ]}
    />
  );
}
