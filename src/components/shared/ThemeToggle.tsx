import { Button } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme } from "../../contexts/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      style={{ 
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {mode === "light" ? "Dark" : "Light"}
    </Button>
  );
}
