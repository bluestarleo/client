import { notFound } from "next/navigation";
import { db, CityGroup, Article } from "@/lib/db";
import CityPageContent from "@/components/CityPageContent";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CityPage({ params }: PageProps) {
  const { id } = await params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return notFound();
  }

  // 1. Fetch group details
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as CityGroup | undefined;

  if (!group) {
    return notFound();
  }

  // 2. Fetch all articles for this group
  const articles = db.prepare("SELECT * FROM articles WHERE group_id = ? ORDER BY title ASC").all(groupId) as Article[];

  return <CityPageContent group={group} articles={articles} />;
}
