"use client";

import { useState } from "react";
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
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession,signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    email: "",
    password: ""
  });

  const onLogin = async () => {
    try {
      const response = await signIn("credentials", {
        redirect: false,
        email: user.email,
        password: user.password
      });
      if (response?.error) {
        toast.error(response.error);
      } else {
        toast.success("User signed in successfully");
        router.push("/");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Sign in failed", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const { data: session } = useSession();
  
    useEffect(() => {
      if (session) {
        router.push("/");
      }
    });
  
    if (session) {
      return null;
    }
  return (
    <motion.div
    initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }} className="flex items-center justify-center h-screen">
      <Card className="w-[400px] m-auto">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
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
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={onLogin} >Login</Button>
          <Link href="/sign-up">
            Visit Sign-up Page
          </Link>
        </CardFooter>
      </Card>
      </motion.div>
  )
}