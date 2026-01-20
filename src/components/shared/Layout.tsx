import { Layout as AntLayout, Typography } from "antd";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {showHeader && (
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              color: "inherit",
              fontWeight: 600,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            PromptGrade
          </Title>
          <ThemeToggle />
        </Header>
      )}
      <Content 
        style={{ 
          padding: "32px", 
          maxWidth: "100%", 
          overflowX: "auto",
          background: "transparent",
        }}
      >
        {children}
      </Content>
    </AntLayout>
  );
}
