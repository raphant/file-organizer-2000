"use server";
import { UserUsageTable, createOrUpdateUserUsage } from "@/drizzle/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Unkey } from "@unkey/api";

export async function create() {
  "use server";
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const token = process.env.UNKEY_ROOT_KEY;
  const apiId = process.env.UNKEY_API_ID;

  if (!token || !apiId) {
    return null;
  }

  // const name = (formData.get("name") as string) ?? "My Awesome API";
  const name = "my api key";
  const unkey = new Unkey({ token });

  // Check if the user is a paid user

  const key = await unkey.keys.create({
    name: name,
    ownerId: userId,
    apiId,
  });
  return { key: key.result };
}
