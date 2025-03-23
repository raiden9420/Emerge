import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Index() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}
