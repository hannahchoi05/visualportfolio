import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import ReactMarkdown from "react-markdown";
import rawGraphData from "../data/graphData.json";
import { getNotes } from "../firebase/notes";
import { getGraphData } from "../firebase/graphNodes";
import { useAuth } from "../context/AuthContext";
import { FileText, Maximize2, X, ChevronLeft } from "lucide-react";

const typeColors = {
  person: "#fff",
  education: "#4ade80",
  experience: "#60a5fa",
  project: "#f472b6",
  interest: "#a78bfa",
  note: "#fbbf24"  // Yellow/amber for notes
};

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [notes, setNotes] = useState([]);
  const [firebaseData, setFirebaseData] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const graphRef = useRef();
  const { isAdmin } = useAuth();

  // Set initial zoom level
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.zoom(4, 500); // zoom level 2, with 500ms transition
    }
  }, []);

  // Load data from Firebase
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedNotes, graphDataFromFirebase] = await Promise.all([
          getNotes(),
          getGraphData()
        ]);
        setNotes(fetchedNotes);
        // Only use Firebase data if it has nodes
        if (graphDataFromFirebase.nodes.length > 0) {
          console.log('Loaded from Firebase:', graphDataFromFirebase.nodes.length, 'nodes,', graphDataFromFirebase.links.length, 'links');
          console.log('Nodes:', graphDataFromFirebase.nodes);
          console.log('Links:', graphDataFromFirebase.links);
          setFirebaseData(graphDataFromFirebase);
        }
      } catch (error) {
        console.log("Firebase data not loaded, using static JSON:", error);
      }
    }
    loadData();
  }, []);

  // Add colors to nodes (no longer merging notes as nodes)
  const graphData = useMemo(() => {
    // Use Firebase data if available, otherwise fall back to static JSON
    const sourceData = firebaseData || rawGraphData;
    
    return {
      nodes: sourceData.nodes.map(node => ({
        ...node,
        color: typeColors[node.type] || "#999",
        val: node.type === "person" ? 3 : 1
      })),
      links: sourceData.links
    };
  }, [firebaseData]);

  // Get notes related to the selected node (by tag matching)
  const relatedNotes = useMemo(() => {
    if (!selectedNode) return [];
    return notes.filter(note => 
      note.tags?.some(tag => 
        tag.toLowerCase() === selectedNode.id?.toLowerCase() ||
        tag.toLowerCase() === selectedNode.label?.toLowerCase()
      )
    );
  }, [selectedNode, notes]);

  const handleNodeClick = useCallback((node) => {
    console.log("Node clicked:", node);
    setSelectedNode(node);
    setSelectedNote(null);
    setIsNoteExpanded(false);
  }, []);

  // Draw nodes with labels
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label || node.id || 'Unknown';
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

      {/* Admin button */}
      <Link 
        to={isAdmin ? "/admin" : "/login"} 
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "380px",
          color: "#666",
          textDecoration: "none",
          fontSize: "0.85rem",
          zIndex: 100,
          padding: "0.5rem 1rem",
          border: "1px solid #333",
          borderRadius: "6px",
          transition: "border-color 0.2s"
        }}
      >
        {isAdmin ? "Dashboard" : "Admin"}
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

      {/* Expanded Note Overlay */}
      {isNoteExpanded && selectedNote && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#121212",
          zIndex: 1000,
          padding: "2rem",
          overflowY: "auto"
        }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <button
              onClick={() => setIsNoteExpanded(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
                marginBottom: "2rem",
                fontSize: "0.95rem"
              }}
            >
              <ChevronLeft size={20} />
              Back to graph
            </button>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <FileText size={20} style={{ color: "#fbbf24" }} />
              <span style={{ color: "#fbbf24", fontSize: "0.85rem", textTransform: "uppercase" }}>
                Note
              </span>
            </div>
            
            <h1 style={{ 
              fontSize: "2.5rem", 
              fontWeight: "600", 
              color: "#fff", 
              marginBottom: "1.5rem" 
            }}>
              {selectedNote.title}
            </h1>
            
            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
                {selectedNote.tags.map((tag) => (
                  <span 
                    key={tag}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "rgba(251, 191, 36, 0.1)",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      color: "#fbbf24",
                      border: "1px solid rgba(251, 191, 36, 0.3)"
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="markdown-content" style={{ 
              color: "#a0a0a0", 
              lineHeight: 1.8, 
              fontSize: "1.1rem"
            }}>
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

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
              marginBottom: "1.5rem",
              whiteSpace: "pre-wrap"
            }}>
              {selectedNode.description || selectedNode.summary}
            </p>

            {/* Related Notes Section */}
            {relatedNotes.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ 
                  color: "#666", 
                  fontSize: "0.8rem", 
                  textTransform: "uppercase",
                  marginBottom: "0.75rem"
                }}>
                  Notes
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {relatedNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: selectedNote?.id === note.id ? "rgba(251, 191, 36, 0.15)" : "#2a2a2a",
                        border: selectedNote?.id === note.id ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid #333",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "#fff",
                        fontSize: "0.9rem",
                        transition: "all 0.2s"
                      }}
                    >
                      <FileText size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{note.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note Preview */}
            {selectedNote && (
              <div style={{ 
                marginBottom: "1.5rem",
                padding: "1rem",
                backgroundColor: "#252525",
                borderRadius: "8px",
                border: "1px solid #333"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  marginBottom: "0.75rem"
                }}>
                  <h4 style={{ color: "#fbbf24", fontSize: "1rem", margin: 0 }}>
                    {selectedNote.title}
                  </h4>
                  <button
                    onClick={() => setIsNoteExpanded(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      background: "none",
                      border: "none",
                      color: "#888",
                      cursor: "pointer",
                      fontSize: "0.8rem"
                    }}
                    title="Expand note"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="markdown-content" style={{ 
                  color: "#a0a0a0", 
                  fontSize: "0.85rem", 
                  lineHeight: 1.6,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                </div>
                <button
                  onClick={() => setIsNoteExpanded(true)}
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#fbbf24",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "500"
                  }}
                >
                  Read more →
                </button>
              </div>
            )}

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
