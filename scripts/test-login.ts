import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error("Missing Supabase env variables");
    process.exit(1);
  }

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "crawlguardllc@gmail.com",
    password: "Elijah1999",
  });

  console.log("signIn error:", error);
  console.log("have token:", Boolean(data.session?.access_token));

  if (data.session?.access_token) {
    const res = await fetch("http://127.0.0.1:5000/api/user", {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });

    console.log("api/user status:", res.status);
    console.log("api/user body:", await res.text());
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
