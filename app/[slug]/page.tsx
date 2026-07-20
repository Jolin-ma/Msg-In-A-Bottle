import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoomBySlug, markRoomRead } from "@/lib/rooms";
import RoomView from "@/components/RoomView";
import DiaryRoomView from "@/components/DiaryRoomView";

export const dynamic = "force-dynamic";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) {
    notFound();
  }

  const session = await auth();
  const isOwner = Boolean(session?.user && session.user.id === room.ownerId);

  // A diary bottle is a private journal — the slug alone must not open it.
  // Render it indistinguishably from a room that doesn't exist.
  if (room.isDiary && !isOwner) {
    notFound();
  }

  if (isOwner) {
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
        ownerName={room.owner?.name ?? null}
        roomPrompt={room.name}
        initialEntries={[...messages].reverse()}
      />
    );
  }

  return (
    <RoomView
      key={room.slug}
      slug={room.slug}
      ownerName={room.owner?.name ?? null}
      roomPrompt={room.name}
      initialMessages={messages}
      isOwner={isOwner}
      hasVisitorEmail={Boolean(room.visitorEmail)}
    />
  );
}
