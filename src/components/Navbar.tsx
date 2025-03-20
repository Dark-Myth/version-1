'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navbarList } from "@/constants/navbar";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem
} from "@/components/ui/menubar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, UserPlus,  User } from "lucide-react";
import { Separator } from "./ui/separator";

const Navbar = () => {
  // Track whether the sheet is open
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="w-full shadow-neutral-300 shadow-sm z-2">
      
      <Menubar className="rounded-none flex justify-between gap-16 h-10 max-sm:hidden  overflow-hidden">
      <div  className="flex justify-center items-center gap-16 mx-auto max-md:gap-1">
        {navbarList.map((item) => {
          const isActive = pathname === item.href;
          return (
            <MenubarMenu key={item.name}>
              <MenubarTrigger>
                <Link href={item.href} className="w-full text-[16px] ">
                  <span className={cn({ underline: isActive })}>{item.name}</span>
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          );
        })}
        {session && 
          <MenubarMenu>
            <MenubarTrigger>
                <Link href={`/management/${session.user!.id}`} className="w-full text-[16px]">
                <span className={cn({ underline: pathname === `/management/${session.user!.id}` })}>Management</span>
                </Link>
            </MenubarTrigger>
          </MenubarMenu>}
        </div>
        <div className="mr-4">
        <MenubarMenu>
          <MenubarTrigger>
            <User/>
          </MenubarTrigger>
          <MenubarContent>
            {!session ? (
              <>
                <MenubarItem>
                  <Link href="/sign-in" className="flex items-center gap-2 w-full">
                    <LogIn />
                    Sign In
                  </Link>
                </MenubarItem>
                <Separator/>
                <MenubarItem>
                  <Link href="/sign-up" className="flex items-center gap-2 w-full">
                    <UserPlus />
                    Sign Up
                  </Link>
                </MenubarItem>
              </>
            ) : (
              <MenubarItem onClick={() => signOut()} className="flex items-center gap-2 w-full cursor-auto">
                <LogOut />
                Sign Out
              </MenubarItem>
            )}
          </MenubarContent>
        </MenubarMenu>
        </div>
      </Menubar>

      {/* Mobile sheet menu */}
      <div className="m-2 sm:hidden flex flex-between justify-between overflow-hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Image
              src="/menu.svg"
              alt="logo"
              width="24"
              height="24"
              className="sm:hidden cursor-pointer"
            />
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="mx-auto text-center text-3xl">Menu</SheetTitle>
            </SheetHeader>
            {navbarList.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 mx-auto text-center overflow-auto "
                onClick={() => setOpen(false)} // Close sheet on link click
              >
                {item.name}
              </Link>
            ))}
              {session && 

              <Link href={`/management/${session.user!.id}`} className="block py-2 mx-auto text-center text-"
              onClick={() => setOpen(false)}>
                <span className={cn({ underline: pathname === `/management/${session.user!.id}` })}>Management</span>
              </Link>}
          </SheetContent>
        </Sheet>
        <Menubar className="border-none">
          <MenubarMenu>
          <MenubarTrigger>
            <User/>
          </MenubarTrigger>
          <MenubarContent>

              {!session ? (
                <>
                <MenubarItem>
                  <Link
                    href="/sign-in"
                    className="py-2 mx-auto text-center flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <LogIn />
                    Sign In
                  </Link>
                  </MenubarItem>
                  <Separator/>
                  <MenubarItem>
                  <Link
                    href="/sign-up"
                    className="block py-2 mx-auto text-center flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <UserPlus />
                    Sign Up
                  </Link>
                  </MenubarItem>
                </>
              ) : (
                <div
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="mx-auto text-center flex items-center cursor-pointer"
                >
                  <LogOut />
                  Sign Out
                </div>
              )}
              </MenubarContent>
              </MenubarMenu>
        </Menubar>
      </div>
    </nav>
  );
};

export default Navbar;