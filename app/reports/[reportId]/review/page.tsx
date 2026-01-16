import { ReviewManager } from "@/features/review/ReviewManager";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReviewManager reportId={reportId} />;
}
