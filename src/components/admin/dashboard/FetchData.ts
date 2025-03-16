import sdb from "@/db/surrealdb";
export async function FetchCounts() {
  const db = await sdb();
  const chatRes = await db.query("SELECT count() as count FROM Chat GROUP ALL");
  const chatCount = chatRes?.[0]?.[0]?.count || 0;

  const chatUserRes = await db.query(
    "SELECT count() as count FROM ChatUser GROUP ALL"
  );
  const chatUserCount = chatUserRes?.[0]?.[0]?.count || 0;

  const pendingRes = await db.query(
    "SELECT count() as count FROM Chat WHERE status='pending' GROUP ALL"
  );
  const pendingCount = pendingRes?.[0]?.[0]?.count || 0;

  return [
    { title: "Chats", description: chatCount.toString() },
    { title: "Customers", description: chatUserCount.toString() },
    { title: "Pending Chats", description: pendingCount.toString() },
  ];
}

export async function FetchAdminsData(adminsList: any) {
  const db = await sdb();
  const res = await db.query(`SELECT admin_id FROM Chat`);
  const admins = Array.isArray(res?.[0]) ? res[0] : [];
  const adminIds = admins.map((admin: any) => admin.admin_id);

  const freqMap: Record<string, number> = {};
  adminIds.forEach((id: string) => {
    freqMap[id] = (freqMap[id] || 0) + 1;
  });

  return adminsList
    .map((admin) => ({
      ...admin,
      matchingCount: freqMap[admin.id] || 0,
    }))
    .sort((a, b) => b.matchingCount - a.matchingCount)
    .slice(0, 5);
}



export async function FetchChartData() {
  try {
    const db = await sdb();
    const res = await db.query(
      'SELECT * FROM Chat ORDER BY created_at DESC LIMIT 100'
    );

    const chats = Array.isArray(res?.[0]) ? res[0] : [];

    // Group chat records by their creation date
    const groupByDate = chats.reduce(
      (acc: Record<string, number>, chat: any) => {
        const date = new Date(chat.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += 1;
        return acc;
      },
      {}
    );

    // Get the last 5 days with data
    const lastFiveDays = Object.entries(groupByDate)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .slice(0, 5)
      .reverse();

    // Format the grouped data for the chart component
    const formattedData = lastFiveDays.map(([date, total]) => ({
      name: date,
      total,
    }));

    return formattedData;
  } catch (error) {
    throw error;
  }
}