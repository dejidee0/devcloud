"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("devcloud_authenticated") !== "true") {
      router.replace("/login");
      return;
    }

    setVerified(true);
  }, [router]);

  if (!verified) {
    return null;
  }

  return children;
}
