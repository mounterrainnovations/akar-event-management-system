import BookingStatusPage from "@/components/booking/BookingStatusPage";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BookingSuccessPage({ searchParams }: PageProps) {
  return <BookingStatusPage variant="success" searchParams={searchParams} />;
}
