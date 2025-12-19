import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  BookOpen,
  Github,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Zap,
  ArrowRight,
} from "lucide-react";

interface LoginProps {
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { signInWithEmail, signInWithGitHub } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleGitHubLogin = async () => {
    setError(null);
    const { error } = await signInWithGitHub();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "var(--bg-base)",
      }}
    >
      {/* Main container */}
      <div
        style={{
          position: "relative",
          maxWidth: "440px",
          width: "100%",
          zIndex: 1,
        }}
      >
        {/* Logo and Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "3rem",
            animation: "fade-in-down 0.8s ease-out",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              position: "relative",
            }}
          >
            {/* Logo glow effect */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                background: "radial-gradient(circle, rgba(0, 245, 255, 0.3) 0%, transparent 70%)",
                filter: "blur(30px)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "relative",
                padding: "1.25rem",
                borderRadius: "1.5rem",
                background: "rgba(0, 245, 255, 0.1)",
                border: "1px solid rgba(0, 245, 255, 0.2)",
                boxShadow: "0 8px 32px rgba(0, 245, 255, 0.15)",
              }}
            >
              <BookOpen
                style={{
                  width: "3rem",
                  height: "3rem",
                  color: "#00f5ff",
                  filter: "drop-shadow(0 0 12px rgba(0, 245, 255, 0.5))",
                }}
              />
            </div>
          </div>

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #00f5ff 0%, #ff00ff 50%, #00ff88 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            FocusFlow
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Inicia sesión para enfocarte
          </p>
        </div>

        {/* Main glass card */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "1.75rem",
            padding: "2.5rem",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            animation: "fade-in-up 0.8s ease-out 0.2s both",
          }}
        >
          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "1rem",
                padding: "1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                animation: "shake 0.5s ease",
              }}
            >
              <AlertCircle
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: "var(--status-error)",
                  flexShrink: 0,
                  marginTop: "0.125rem",
                }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--status-error)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* GitHub Login */}
          <button
            onClick={handleGitHubLogin}
            type="button"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "1rem 1.5rem",
              border: "1px solid var(--glass-border)",
              borderRadius: "1rem",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 245, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(0, 245, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--glass-border)";
            }}
          >
            <Github style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>Continuar con GitHub</span>
          </button>

          {/* Divider */}
          <div
            style={{
              position: "relative",
              margin: "2rem 0",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, var(--glass-border), transparent)",
                }}
              />
            </div>
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  padding: "0 1rem",
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                O usa tu email
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                  letterSpacing: "0.01em",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "1.125rem",
                    height: "1.125rem",
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  style={{
                    width: "100%",
                    paddingLeft: "3rem",
                    paddingRight: "1.25rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "0.875rem",
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0, 245, 255, 0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0, 245, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--glass-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                  letterSpacing: "0.01em",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "1.125rem",
                    height: "1.125rem",
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    paddingLeft: "3rem",
                    paddingRight: "1.25rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "0.875rem",
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0, 245, 255, 0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0, 245, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--glass-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                padding: "1rem 1.5rem",
                marginTop: "0.5rem",
                border: "none",
                borderRadius: "1rem",
                background: loading
                  ? "rgba(0, 245, 255, 0.4)"
                  : "linear-gradient(135deg, #00f5ff 0%, #00d4d4 100%)",
                color: loading ? "rgba(0, 0, 0, 0.5)" : "#000",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(0, 245, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 245, 255, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 245, 255, 0.3)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Zap style={{ width: "1.125rem", height: "1.125rem" }} />
                  <span>Iniciar sesión</span>
                  <ArrowRight style={{ width: "1.125rem", height: "1.125rem" }} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            animation: "fade-in 1s ease-out 0.4s both",
          }}
        >
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9375rem",
              margin: 0,
            }}
          >
            ¿No tienes cuenta?{" "}
            <button
              onClick={onSwitchToRegister}
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#00f5ff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "inherit",
                padding: 0,
                textDecoration: "none",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.color = "#00d4d4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
                e.currentTarget.style.color = "#00f5ff";
              }}
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
