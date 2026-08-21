import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const categories = [
  { label: "All items", active: true },
  { label: "Favorites" },
  { label: "Logins" },
  { label: "Secure notes" },
]

function PasswordRowSkeleton() {
  return (
    <div className="flex min-h-16 items-center gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32 max-w-full" />
        <Skeleton className="h-3 w-48 max-w-[75%]" />
      </div>
      <Skeleton className="h-8 w-16 shrink-0" />
    </div>
  )
}

export default function Dashboard() {
  const isLoading = true
  //set is loading to false when we actually connect backend n get data

  return (
    <main className="mx-auto max-w-6xl p-5 sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Unlocked vault</p>
          <div className="mt-1 flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-8 w-44" />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight">Vault name</h1>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline">
            Lock vault
          </Button>
          <Button type="button">New item</Button>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside aria-label="Vault categories">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Vault</CardTitle>
              <CardDescription>saved password nyah</CardDescription>
            </CardHeader>
            <CardContent>
              <nav className="space-y-1" aria-label="Password categories">
                {categories.map(({ label, active }) => (
                  <Button
                    className="w-full justify-start"
                    key={label}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                  >
                    {label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-4" aria-labelledby="passwords-heading">
          <div>
            <Label className="sr-only" htmlFor="vault-search">
              Search this vault
            </Label>
            <Input
              id="vault-search"
              placeholder="Search"
              type="search"
            />
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle id="passwords-heading">Passwords</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div aria-busy={isLoading} aria-label="Loading password entries">
                {Array.from({ length: 6 }, (_, index) => (
                  <PasswordRowSkeleton key={index} />
                ))}
                <span className="sr-only" role="status">
                  Loading password entries
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
