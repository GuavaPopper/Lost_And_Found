import Link from "next/link"
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 sm:p-8">
      <Card className="mx-auto max-w-md w-full shadow-lg border">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold">FT UNTAN Lost & Found</CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-4">
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm px-6 py-4 border-t bg-muted/20">
          <div className="text-muted-foreground">
            Faculty of Engineering, Tanjungpura University
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 