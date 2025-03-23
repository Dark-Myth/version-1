"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#111111",
        color: "#e2e2e2",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #1a1a1a, #111111)"
        }}>
          <div style={{
            maxWidth: "500px",
            padding: "2rem",
            backgroundColor: "#262626",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
            textAlign: "center",
            border: "1px solid #333333"
          }}>
            <h1 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "bold",
              color: "#e2e2e2",
              marginBottom: "1rem"
            }}>
              Critical Cricket System Error
            </h1>
            
            <p style={{ color: "#b0b0b0", marginBottom: "1rem" }}>
              Our cricket management system has encountered a critical error.
            </p>
            
            <div style={{
              backgroundColor: "#1c1c1c",
              padding: "1rem",
              borderRadius: "0.25rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              border: "1px solid #333333"
            }}>
              <pre style={{
                fontSize: "0.875rem",
                fontFamily: "monospace",
                color: "#ff8080",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {error?.message || "An unexpected error occurred"}
              </pre>
            </div>
            
            <button 
              onClick={reset}
              style={{
                backgroundColor: "#444444",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                borderRadius: "0.25rem",
                border: "1px solid #555555",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Try Again
            </button>
            
            <div style={{
              marginTop: "1.5rem",
              padding: "0.75rem",
              backgroundColor: "#1c1c1c",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              color: "#888888",
              textAlign: "center"
            }}>
              If this error persists, please contact support or refresh the page.
            </div>
          </div>
          
          <div style={{
            marginTop: "2rem",
            textAlign: "center"
          }}>
            <p style={{
              fontSize: "0.875rem",
              color: "#666666"
            }}>
              © {new Date().getFullYear()} Cricket Management System
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}