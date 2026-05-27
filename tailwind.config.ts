import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS変数を使用したテーマカラー
        dark: {
          bg: "var(--bg)",
          panel: "var(--panel)",
          panel2: "var(--panel2)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--muted)",
        },
        cyan: "var(--cyan)",
        // ドライバーカラー（固定）
        driver: {
          hosoda: "#FF6B6B",
          naito: "#4ECDC4",
          hirano: "#45B7D1",
          morita: "#A8E6CF",
          moriya: "#FFD93D",
          hashimoto: "#C77DFF",
          yokomizo: "#00D2D3",
          takahashi: "#FF9F43",
          takano: "#98D8C8",
        },
        // 油種カラー
        oil: {
          keiyu: "#4FC3F7",
          juyu: "#FF7043",
          touyu: "#A5D6A7",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "Yu Gothic UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
