import { Activity } from "@/models/Activity";
import { User } from "@/models/User";

interface LogActivityParams {
  cardId: string;
  type: string;
  text: string;
  actorId?: string;
  actorName?: string;
  actorImage?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  let actorName = params.actorName ?? "Someone";
  let actorImage = params.actorImage;

  if (params.actorId && !params.actorName) {
    const user = await User.findById(params.actorId).lean();
    if (user) {
      actorName = (user as { name: string }).name;
      actorImage = (user as { image?: string }).image;
    }
  }

  await Activity.create({
    cardId: params.cardId,
    type: params.type,
    actorId: params.actorId,
    actorName,
    actorImage,
    text: params.text,
  });
}

export async function getActorFromUserId(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return { actorName: "Someone", actorImage: undefined };
  return {
    actorName: (user as { name: string }).name,
    actorImage: (user as { image?: string }).image,
  };
}
