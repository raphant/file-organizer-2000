import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { db, UserUsageTable } from "../drizzle/schema"; // Adjust the import according to your setup
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

async function getActiveSubscriptions() {
  console.log("Fetching active subscriptions");

  // Fetch all active subscriptions from the database
  const dbSubscriptions = await db
    .select()
    .from(UserUsageTable)
    .where(eq(UserUsageTable.subscriptionStatus, "active"));

  console.log(dbSubscriptions);
  const activeEmails = [];

  for (const dbSubscription of dbSubscriptions) {
    // Get user from Clerk by email
    const clerkUsers = await clerkClient.users.getUserList({
      userId: [dbSubscription.userId],
    });

    if (clerkUsers.data.length === 0) {
      console.log(
        `No user found in Clerk for userId ${dbSubscription.userId}, skipping`
      );
      continue;
    }

    const clerkUser = clerkUsers.data[0];
    const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress;

    activeEmails.push({
      userId: dbSubscription.userId,
      clerkEmail,
    });

    console.log(
      `Found active subscription for email: ${dbSubscription.userId}`
    );
  }

  return activeEmails;
}

// Run the function and log the results
getActiveSubscriptions()
  .then((emails) => console.log("Active subscription emails:", emails))
  .catch(console.error);
