import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Home() {
    const [showPassword, setShowPassword] = useState(false)
    const [userInput, setUserInput] = useState("")
    const [invalid, setInvalid] = useState("")

    const passwordRegex =
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!passwordRegex.test(userInput)) {
            setInvalid(
                "Password must be 8–16 characters and contain at least one uppercase letter, lowercase letter, number, and special character."
            )
            return
        }

        setInvalid("")

        // Password is valid
        console.log("Valid password:", userInput)
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-sm space-y-6">

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">
                        PixelPass
                    </h1>

                    <p className="text-muted-foreground">
                        Sign in to your account
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    {/* Password */}
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium"
                        >
                            Password
                        </label>

                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={userInput}
                                onChange={(e) => {
                                    setUserInput(e.target.value)
                                    setInvalid("")
                                }}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className={`pr-10 ${
                                    invalid
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                }`}
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}

                                <span className="sr-only">
                                    {showPassword
                                        ? "Hide password"
                                        : "Show password"}
                                </span>
                            </Button>
                        </div>

                        {invalid && (
                            <p className="text-sm text-red-500">
                                {invalid}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                    >
                        Sign in
                    </Button>

                </form>
            </div>
        </main>
    )
}
