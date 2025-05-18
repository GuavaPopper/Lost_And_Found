"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SupabaseTester() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [envVars, setEnvVars] = useState({
    url: "",
    key: ""
  });

  // Check environment variables
  useEffect(() => {
    setEnvVars({
      url: window.location.hostname === "localhost" ? process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set" : "Hidden in production",
      key: window.location.hostname === "localhost" ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "..." : 
          "Not set" : 
        "Hidden in production"
    });
  }, []);

  async function testConnection() {
    setStatus("loading");
    try {
      // Try to fetch a single row from a table
      const { data, error } = await supabase
        .from("user")
        .select("id_user")
        .limit(1);
      
      if (error) throw error;
      
      setMessage(`Success! Found ${data.length} users.`);
      setStatus("success");
    } catch (error) {
      console.error("Connection test failed:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Supabase Connection Tester</h2>
      
      <div className="grid gap-2">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {envVars.url}
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {envVars.key}
        </div>
      </div>
      
      <Button onClick={testConnection}>
        Test Connection
      </Button>
      
      {status !== "loading" && (
        <Alert variant={status === "success" ? "default" : "destructive"}>
          <AlertTitle>{status === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 