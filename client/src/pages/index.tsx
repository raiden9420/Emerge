import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Index() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    // Check if the user has completed the survey
    const userId = localStorage.getItem('userId');
    if (userId) {
      setLocation("/dashboard");
    } else {
      setLocation("/survey");
    }
  }, [setLocation]);

  return null;
}