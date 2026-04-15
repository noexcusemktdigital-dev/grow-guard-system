// ═══════════════════════════════════════════════
// NOEXCUSE — Central Chart Theme
// Importe daqui em todos os componentes de gráfico
// ═══════════════════════════════════════════════

export const CHART_COLORS = {
  purple: "#7F77DD",
  teal: "#1D9E75",
  amber: "#EF9F27",
  coral: "#D85A30",
  blue: "#378ADD",
  pink: "#D4537E",
  green: "#639922",
  red: "#E24B4A",
};

// Paleta sequencial para múltiplas séries
export const CHART_PALETTE = [
  "#7F77DD", "#1D9E75", "#EF9F27", "#378ADD",
  "#D85A30", "#D4537E", "#639922", "#E24B4A",
];

// Grid e texto consistentes
export const CHART_GRID_COLOR = "rgba(0,0,0,0.05)";
export const CHART_GRID_COLOR_DARK = "rgba(255,255,255,0.06)";
export const CHART_TEXT_COLOR = "#888";
export const CHART_TICK_STYLE = { fontSize: 11, fill: "#888" };

// Stroke padrão para linhas
export const CHART_STROKE_WIDTH = 2.5;

// Gradientes para AreaChart — usar dentro de <defs>
export const CHART_GRADIENTS = {
  purple: { id: "gradPurple", color: "#7F77DD" },
  teal: { id: "gradTeal", color: "#1D9E75" },
  amber: { id: "gradAmber", color: "#EF9F27" },
  blue: { id: "gradBlue", color: "#378ADD" },
};

// Props padrão do CartesianGrid
export const CHART_GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: CHART_GRID_COLOR,
  vertical: false,
};

// Tooltip customizado — use como componente
export function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: "var(--background)",
      border: "0.5px solid rgba(0,0,0,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      fontSize: 12,
    }}>
      {label && <p style={{ color: "#888", marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color, margin: "2px 0", fontWeight: 500 }}>
          {entry.name}: {formatter
            ? formatter(entry.value, entry.name)
            : entry.value?.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
}

// Dot customizado para LineChart
export function ChartDot({ cx, cy, fill }: any) {
  return (
    <circle cx={cx} cy={cy} r={4}
      fill="#fff" stroke={fill} strokeWidth={2}
    />
  );
}

// Definições de gradiente SVG — coloque dentro do gráfico
export function GradientDefs() {
  return (
    <defs>
      {Object.values(CHART_GRADIENTS).map(g => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={g.color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={g.color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  );
}

// Formatter de moeda BRL
export const formatBRL = (v: number) =>
  v >= 1000
    ? `R$ ${(v / 1000).toFixed(0)}k`
    : `R$ ${v.toLocaleString("pt-BR")}`;

// Formatter de porcentagem
export const formatPct = (v: number) => `${v}%`;
