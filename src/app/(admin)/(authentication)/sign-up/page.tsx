"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.username.length > 0 && user.email.length > 0 && user.password.length > 0 && user.password === user.confirmPassword) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  });

  if (session) {
    return null;
  }

  const onSignup = async () => {
    try {
      setLoading(true);
      await signIn("credentials", {
        redirect: false,
        email: user.email,
        password: user.password
      });
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Sign in failed", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
    initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }} className="flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>{loading ? "Loading..." : "Sign up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="user_id">User name</Label>
                <Input
                  id="user_id"
                  placeholder="Enter your user ID"
                  value={user.username}
                  onChange={(e) => setUser({ ...user, username: e.target.value })}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                />
              </div>
                <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                />
                </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
            <Button onClick={onSignup} disabled={buttonDisabled}>
            {buttonDisabled ? "No Signup" : "Sign up"}
            </Button>
          <Link href="/sign-in">
            Visit Sign-in Page
          </Link>
        </CardFooter>
      </Card>
      </motion.div>
  )
}