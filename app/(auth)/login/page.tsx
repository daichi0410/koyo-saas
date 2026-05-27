"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-dark-text">
            向陽 <span className="text-cyan">SaaS</span>
          </h1>
          <p className="text-dark-muted text-sm mt-2">
            燃料配送の配車管理システム
          </p>
        </div>

        {/* ログインフォーム */}
        <form
          onSubmit={handleLogin}
          className="bg-dark-panel border border-dark-border rounded-lg p-6"
        >
          <h2 className="text-lg font-bold text-white mb-6">ログイン</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan transition-colors"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-cyan text-black font-bold rounded hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="text-center text-dark-muted text-xs mt-6">
          アカウントをお持ちでない場合は管理者にお問い合わせください
        </p>
      </div>
    </div>
  );
}
