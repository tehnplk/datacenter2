import MetricPage from "@/components/dashboard/MetricPage";

export default function Page() {
  return (
    <MetricPage
      title="ICU: การตายใน ICU / semi ICU"
      description="สาเหตุการตาย 10 อันดับ + อัตราการตายรวม + อัตราการตายแยกโรค (Top 10)"
      notes={[
        "แนะนำมี: Top 10 cause table + mortality rate summary card",
        "ต้องนิยามการตาย: death in ICU vs semi ICU และช่วงเวลา",
      ]}
    />
  );
}
