import RoomView from "@/components/RoomView";

const DEMO_MESSAGE = {
  id: "demo-1",
  text: "the smell of rain on warm pavement",
  createdAt: new Date().toISOString(),
};

export default function PreviewPage() {
  return <RoomView slug="preview" initialMessages={[DEMO_MESSAGE]} />;
}
