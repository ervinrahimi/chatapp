import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Sample data for recent sales
const recentSales = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+$299.00" },
  { name: "William Kim", email: "will@email.com", amount: "+$99.00" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00" },
]

// SalesCard component to display recent sales
const SalesCard = () => {
  return (
    <div className="col-span-3">
      <div className="h-full space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow">
        <div className="flex flex-col space-y-2">
          <h3 className="text-xl font-semibold">Recent Sales</h3>
          <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.email} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {/* Display initials of the name */}
                    {sale.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">{sale.name}</p>
                  <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
                <div className="ml-auto font-medium">{sale.amount}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default SalesCard
