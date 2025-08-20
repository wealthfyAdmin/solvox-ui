import SignUpForm from "@/components/auth/signupform";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Solvox AI",
  description: "SignUpForm of Solvox AI",
};

export default function SignUp() {
  return <SignUpForm />;
}
