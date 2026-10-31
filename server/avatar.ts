import { env } from "cloudflare:workers";
import { hash, ApiError } from "./security";
export function avatarBucket() {
  if (!env.BUCKET)
    throw new ApiError(503, "Rasm saqlash xizmati hozircha mavjud emas.");
  return env.BUCKET;
}
export const avatarKey = (userId: string) => `avatars/${hash(userId)}`;
