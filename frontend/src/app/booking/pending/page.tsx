import BookingStatusPage from "@/components/booking/BookingStatusPage";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BookingPendingPage({ searchParams }: PageProps) {
  return <BookingStatusPage variant="pending" searchParams={searchParams} />;
}
