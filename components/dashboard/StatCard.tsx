import { Card, CardContent, Typography } from "@mui/material";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  color: string;
};

export function StatCard({ title, value, subtitle, color }: StatCardProps) {
  return (
    <Card
      sx={{
        backgroundColor: "#1e293b",
        borderRadius: 4,
        width: 260,
      }}
    >
      <CardContent>
        <Typography variant="h5" sx={{ color: "white" }}>
          {title}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            color,
            mt: 2,
            fontWeight: "bold",
          }}
        >
          {value}
        </Typography>

        <Typography sx={{ color: "#94a3b8" }}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}