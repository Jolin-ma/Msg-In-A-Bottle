import { auth } from "@/lib/auth";
import { getOrCreateRoom, markRoomRead } from "@/lib/rooms";
import RoomView from "@/components/RoomView";
import DiaryRoomView from "@/components/DiaryRoomView";

export const dynamic = "force-dynamic";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = await getOrCreateRoom(slug);

  const session = await auth();
  if (session?.user && session.user.id === room.ownerId) {
    await markRoomRead(room.id);
  }

  const messages = room.messages.map((message) => ({
    id: message.id,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  }));

  if (room.isDiary) {
    return (
      <DiaryRoomView
        key={room.slug}
        slug={room.slug}
        ownerName={room.owner?.name ?? room.owner?.email ?? null}
        roomPrompt={room.name}
        initialEntries={[...messages].reverse()}
      />
    );
  }

  return (
    <RoomView
      key={room.slug}
      slug={room.slug}
      ownerName={room.owner?.name ?? room.owner?.email ?? null}
      roomPrompt={room.name}
      isPublic={room.isPublic}
      initialMessages={messages}
    />
  );
}
