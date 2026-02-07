import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import rawGraphData from "../data/graphData.json";

const typeColors = {
  person: "#fff",
  education: "#4ade80",
  experience: "#60a5fa",
  project: "#f472b6",
  interest: "#a78bfa"
};

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const graphRef = useRef();

  // Set initial zoom level
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.zoom(4, 500); // zoom level 2, with 500ms transition
    }
  }, []);

  // Add colors to nodes
  const graphData = useMemo(() => ({
    nodes: rawGraphData.nodes.map(node => ({
      ...node,
      color: typeColors[node.type] || "#999",
      val: node.type === "person" ? 3 : 1
    })),
    links: rawGraphData.links
  }), []);

  const handleNodeClick = useCallback((node) => {
    console.log("Node clicked:", node);
    setSelectedNode(node);
  }, []);

  // Draw nodes with labels
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label;
    const fontSize = node.type === "person" ? Math.max(20 / globalScale, 3) : Math.max(12 / globalScale, 3);
    const nodeSize = node.type === "person" ? 9 : 5;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || "#999";
    ctx.fill();
    
    // Draw label below node
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(label, node.x, node.y + nodeSize + 2);
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      backgroundColor: "#121212",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Back button */}
      <Link 
        to="/" 
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.5rem",
          color: "#a0a0a0",
          textDecoration: "none",
          fontSize: "0.95rem",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        ← Back to Portfolio
      </Link>

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: "1.5rem",
        left: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 100
      }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ 
              width: 12, 
              height: 12, 
              borderRadius: "50%", 
              backgroundColor: color 
            }} />
            <span style={{ color: "#888", fontSize: "0.8rem", textTransform: "capitalize" }}>
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node, color, ctx) => {
            const size = node.type === "person" ? 15 : 12;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={() => "rgba(255,255,255,0.2)"}
          linkWidth={1}
          linkDistance={200}
          d3Force={(engine) => {
            engine.d3Force('charge').strength(-500);
            engine.d3Force('link').distance(200);
            engine.d3Force('center').strength(0.05);
          }}
          backgroundColor="#121212"
          onNodeClick={handleNodeClick}
          cooldownTicks={200}
          d3VelocityDecay={0.2}
        />
      </div>

      {/* Detail Panel */}
      <div style={{ 
        width: "350px",
        minWidth: "350px",
        height: "100vh",
        padding: "2rem",
        borderLeft: "1px solid #333",
        backgroundColor: "#1a1a1a",
        overflowY: "auto",
        position: "relative",
        zIndex: 50
      }}>
        <h3 style={{ 
          color: "#666", 
          fontSize: "0.85rem", 
          textTransform: "uppercase", 
          letterSpacing: "0.1em",
          marginBottom: "1.5rem"
        }}>
          Details
        </h3>

        {!selectedNode && (
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Click a node to view details
          </p>
        )}

        {selectedNode && (
          <>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: typeColors[selectedNode.type] || "#999"
              }} />
              <span style={{ 
                color: "#888", 
                fontSize: "0.8rem", 
                textTransform: "uppercase" 
              }}>
                {selectedNode.type}
              </span>
            </div>

            <h2 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "600",
              color: "#fff",
              marginBottom: "1rem"
            }}>
              {selectedNode.label}
            </h2>

            <p style={{ 
              color: "#a0a0a0", 
              lineHeight: 1.7,
              marginBottom: "1.5rem"
            }}>
              {selectedNode.summary}
            </p>

            {selectedNode.skills && selectedNode.skills.length > 0 && (
              <div>
                <h4 style={{ 
                  color: "#666", 
                  fontSize: "0.8rem", 
                  textTransform: "uppercase",
                  marginBottom: "0.75rem"
                }}>
                  Related Skills
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedNode.skills.map((skill) => (
                    <span 
                      key={skill}
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#2a2a2a",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        color: "#a0a0a0",
                        border: "1px solid #333"
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.link && (
              <a
                href={selectedNode.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "1.5rem",
                  padding: "10px 20px",
                  backgroundColor: "#6b8afd",
                  color: "#fff",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.9rem"
                }}
              >
                Open Project →
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
