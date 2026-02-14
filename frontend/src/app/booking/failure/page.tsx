import BookingStatusPage from "@/components/booking/BookingStatusPage";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BookingFailurePage({ searchParams }: PageProps) {
  return <BookingStatusPage variant="failure" searchParams={searchParams} />;
}
