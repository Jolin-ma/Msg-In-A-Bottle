import { getOrCreateRoom } from "@/lib/rooms";
import RoomView from "@/components/RoomView";

export const dynamic = "force-dynamic";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = await getOrCreateRoom(slug);

  return (
    <RoomView
      key={room.slug}
      slug={room.slug}
      ownerName={room.owner?.name ?? room.owner?.email ?? null}
      roomPrompt={room.name}
      initialMessages={room.messages.map((message) => ({
        id: message.id,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
      }))}
    />
  );
}
