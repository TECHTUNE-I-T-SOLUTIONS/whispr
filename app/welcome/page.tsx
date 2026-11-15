import WelcomePage from "@/components/welcome/WelcomePage";

export const metadata = {  alternates: { canonical: "https://whisprwords.com/welcome" },

  title: "Welcome to Whispr",
  description: "Welcome to Whispr, the platform for creative writing and storytelling.",
};

export default function Page() {
  return <WelcomePage />
}
