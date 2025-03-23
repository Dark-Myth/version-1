"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(to bottom, #f5f5f5, #e5e5e5)",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{
        maxWidth: "500px",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        textAlign: "center"
      }}>
        {/* Simple cricket stumps visualization */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto",
          position: "relative",
          height: "100px",
          width: "80px"
        }}>
          {/* Stumps */}
          <div style={{
            width: "8px",
            height: "100px",
            background: "linear-gradient(to bottom, #f0e2bd, #e6c677)",
            borderRadius: "4px",
            position: "absolute",
            left: "20px"
          }}></div>
          <div style={{
            width: "8px",
            height: "100px",
            background: "linear-gradient(to bottom, #f0e2bd, #e6c677)",
            borderRadius: "4px",
            position: "absolute",
            left: "36px"
          }}></div>
          <div style={{
            width: "8px",
            height: "100px",
            background: "linear-gradient(to bottom, #f0e2bd, #e6c677)",
            borderRadius: "4px",
            position: "absolute",
            left: "52px"
          }}></div>
          
          {/* Bails */}
          <div style={{
            width: "20px",
            height: "4px",
            backgroundColor: "#f0e2bd",
            borderRadius: "2px",
            position: "absolute",
            top: "-2px",
            left: "16px"
          }}></div>
          <div style={{
            width: "20px",
            height: "4px",
            backgroundColor: "#f0e2bd",
            borderRadius: "2px",
            position: "absolute",
            top: "-2px",
            left: "44px"
          }}></div>
          
          {/* 404 Display */}
          <div style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            padding: "4px 8px",
            borderRadius: "4px",
            fontWeight: "bold",
            transform: "rotate(-15deg)",
            fontSize: "1rem"
          }}>
            404
          </div>
        </div>

        <h1 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "bold",
          color: "#1e293b",
          marginBottom: "1rem"
        }}>
          Page Not Found!
        </h1>
        
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>
          Looks like you&quot;re searching for a page that&quot;s been bowled out of the system.
        </p>
        
        <div style={{
          backgroundColor: "#f8fafc",
          padding: "1rem",
          borderRadius: "0.25rem",
          marginBottom: "1.5rem",
          textAlign: "left"
        }}>
          <p style={{
            fontSize: "0.875rem",
            color: "#64748b",
            margin: 0
          }}>
            The page you&quot;re looking for doesn&quot;t exist or has been moved to another location.
          </p>
        </div>
        
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          <Link href="/" style={{
            backgroundColor: "#4b5563",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            textDecoration: "none",
            fontWeight: "500",
            textAlign: "center"
          }}>
            Return to Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            style={{
              backgroundColor: "transparent",
              color: "#4b5563",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              border: "1px solid #4b5563",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Go Back
          </button>
        </div>
      </div>
      
      <div style={{
        marginTop: "2rem",
        textAlign: "center"
      }}>
        <p style={{
          fontSize: "0.875rem",
          color: "#64748b"
        }}>
          © {new Date().getFullYear()} Cricket Management System
        </p>
      </div>
    </div>
  );
}