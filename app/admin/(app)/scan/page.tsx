import { Topbar } from "../../_components/Topbar";
import { CheckInScanner } from "../../_components/CheckInScanner";

export default function ScanPage() {
  return (
    <>
      <Topbar title="Check-in scanner" />
      <div className="mx-auto max-w-xl px-5 py-6 sm:px-8 sm:py-8">
        <CheckInScanner />
      </div>
    </>
  );
}
