// app/layout.tsx
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US"; // or your desired locale


export const metadata = {
  title: "AutoSpares",
  description: "Electronics and Motor Spares Management",
};

const theme = {
  token: {
    colorPrimary: "#1677ff", // your primary color
    // Add more tokens as needed
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-zinc-950">
        <ConfigProvider locale={enUS} theme={theme}>
          <ClientWrapper>{children}</ClientWrapper>
        </ConfigProvider>
      </body>
    </html>
  );
}