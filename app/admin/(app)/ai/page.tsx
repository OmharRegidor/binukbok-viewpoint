import { AvailabilityChat } from "../../_components/AvailabilityChat";
import { Topbar } from "../../_components/Topbar";

export const dynamic = "force-dynamic";

export default function AiAssistantPage() {
  return (
    <>
      <Topbar title="AI Assistant" />
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <AvailabilityChat />
      </div>
    </>
  );
}
