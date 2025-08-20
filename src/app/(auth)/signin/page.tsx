import SignInForm from "@/components/auth/signinform";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Solvox AI",
  description: "SignInForm of Solvox AI",
};

export default function SignIn() {
  return <SignInForm />;
}
