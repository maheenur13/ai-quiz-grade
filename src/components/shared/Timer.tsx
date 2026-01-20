import { Typography } from "antd";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface TimerProps {
  durationSeconds: number;
  onExpire: () => void;
  autoStart?: boolean;
}

export function Timer({ durationSeconds, onExpire, autoStart = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0) {
        onExpire();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isLowTime = timeLeft < 60; // Less than 1 minute

  return (
    <Text
      strong
      style={{
        fontSize: "24px",
        color: isLowTime ? "#ff4d4f" : "inherit",
        fontFamily: "monospace",
      }}
    >
      {formattedTime}
    </Text>
  );
}
