import type { PageProps } from "$fresh/server.ts";
import Logo from "@/components/Logo.tsx";
import Head from "@/components/Head.tsx";
import AuthForm from "@/components/AuthForm.tsx";
import Notice from "@/components/Notice.tsx";

export default function LoginPage(props: PageProps) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Login" />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto space-y-8 w-72">
          <a href="/">
            <Logo />
          </a>
          {errorMessage === "Invalid login credentials" && (
            <Notice>{errorMessage}</Notice>
          )}
          <AuthForm type="Login" />
          <div class="text-center text-gray-500 hover:text-black">
            <a href="/signup">Don't have an account? Sign up</a>
          </div>
        </div>
      </div>
    </>
  );
}
