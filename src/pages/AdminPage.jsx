import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import rawGraphData from '../data/graphData.json';
import { testFirebaseConnection } from '../firebase/test';
import { getNotes, createNote, updateNote, deleteNote } from '../firebase/notes';
import { getGraphNodes, createNode, updateNode, deleteNode, initializeGraphData, getGraphLinks, createLink, deleteLink, resetGraphData } from '../firebase/graphNodes';
import { Trash2, Edit3, Plus, LogOut, Eye, ArrowLeft, FileText, GitBranch, Wifi, RefreshCw, X, Link as LinkIcon, RotateCcw } from 'lucide-react';

const NODE_TYPES = ['person', 'education', 'experience', 'project', 'interest', 'note'];
const TYPE_COLORS = {
  person: '#fff',
  education: '#4ade80',
  experience: '#60a5fa',
  project: '#f472b6',
  interest: '#a78bfa',
  note: '#fbbf24'
};

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('nodes'); // 'notes' or 'nodes'
  
  // Firebase status
  const [firebaseStatus, setFirebaseStatus] = useState('untested'); // 'untested', 'testing', 'connected', 'error'
  const [firebaseError, setFirebaseError] = useState('');
  
  // Notes state
  const [notes, setNotes] = useState([]);
  
  // Graph nodes state
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphLinks, setGraphLinks] = useState([]);
  
  // Node connections (links where this node is source)
  const [nodeConnections, setNodeConnections] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Test Firebase connection
  const handleTestFirebase = async () => {
    setFirebaseStatus('testing');
    setFirebaseError('');
    try {
      const result = await testFirebaseConnection();
      if (result.success) {
        setFirebaseStatus('connected');
      } else {
        setFirebaseStatus('error');
        setFirebaseError(result.error || 'Unknown error');
      }
    } catch (err) {
      setFirebaseStatus('error');
      setFirebaseError(err.message);
    }
  };
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state for notes
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Form state for nodes
  const [nodeId, setNodeId] = useState('');
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState('interest');
  const [nodeSummary, setNodeSummary] = useState('');
  const [nodeSkills, setNodeSkills] = useState('');
  const [nodeLink, setNodeLink] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (authLoading) return;
    
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin, authLoading]);

  const loadData = async () => {
    try {
      // Initialize graph data from JSON if Firestore is empty
      await initializeGraphData();
      
      // Load from Firebase
      const [fetchedNotes, fetchedNodes, fetchedLinks] = await Promise.all([
        getNotes(),
        getGraphNodes(),
        getGraphLinks()
      ]);
      
      setNotes(fetchedNotes);
      setGraphNodes(fetchedNodes);
      setGraphLinks(fetchedLinks);
    } catch (error) {
      console.error('Error loading from Firebase, falling back to JSON:', error);
      // Fallback to static JSON
      setGraphNodes(rawGraphData.nodes);
      setGraphLinks(rawGraphData.links.map((l, i) => ({ id: `link-${i}`, ...l })));
    } finally {
      setLoading(false);
    }
  };

  // Note handlers - save to Firebase
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const noteData = {
      title: noteTitle,
      content: noteContent,
      tags: noteTags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (editingItem) {
        await updateNote(editingItem.id, noteData);
      } else {
        await createNote(noteData);
      }
      resetForm();
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note: ' + error.message);
    }
  };

  // Node handlers - save to Firebase
  const handleNodeSubmit = async (e) => {
    e.preventDefault();
    const nodeData = {
      id: nodeId || `node-${Date.now()}`,
      label: nodeLabel,
      type: nodeType,
      summary: nodeSummary,
      skills: nodeSkills.split(',').map(s => s.trim()).filter(Boolean)
    };
    
    // Only add link if it has a value (Firebase doesn't accept undefined)
    if (nodeLink) {
      nodeData.link = nodeLink;
    }

    try {
      const finalNodeId = nodeData.id;
      
      if (editingItem) {
        await updateNode(editingItem.id, nodeData);
        
        // Update links: find existing links where this node is source
        const existingLinks = graphLinks.filter(l => l.source === editingItem.id);
        const existingTargets = existingLinks.map(l => l.target);
        
        // Delete removed links
        for (const link of existingLinks) {
          if (!nodeConnections.includes(link.target)) {
            await deleteLink(link.id);
          }
        }
        
        // Add new links
        for (const target of nodeConnections) {
          if (!existingTargets.includes(target)) {
            await createLink(finalNodeId, target);
          }
        }
      } else {
        await createNode(nodeData);
        
        // Create all new links
        for (const target of nodeConnections) {
          await createLink(finalNodeId, target);
        }
      }
      
      resetForm();
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error saving node:', error);
      alert('Error saving node: ' + error.message);
    }
  };

  const handleEditNote = (note) => {
    setEditingItem(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags?.join(', ') || '');
    setShowEditor(true);
  };

  const handleEditNode = (node) => {
    setEditingItem(node);
    setNodeId(node.id);
    setNodeLabel(node.label || node.name || '');
    setNodeType(node.type || 'interest');
    setNodeSummary(node.summary || '');
    setNodeSkills(node.skills?.join(', ') || '');
    setNodeLink(node.link || '');
    // Load current connections where this node is the source
    const currentConnections = graphLinks
      .filter(link => link.source === node.id)
      .map(link => link.target);
    setNodeConnections(currentConnections);
    setShowEditor(true);
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note: ' + error.message);
      }
    }
  };

  const handleDeleteNode = async (id) => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      try {
        await deleteNode(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting node:', error);
        alert('Error deleting node: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setNodeId('');
    setNodeLabel('');
    setNodeType('interest');
    setNodeSummary('');
    setNodeSkills('');
    setNodeLink('');
    setNodeConnections([]);
    setEditingItem(null);
    setShowEditor(false);
  };

  const handleResetData = async () => {
    if (window.confirm('⚠️ This will DELETE all graph data and reset from graphData.json. Are you sure?')) {
      try {
        setLoading(true);
        await resetGraphData();
        await loadData();
        alert('Graph data reset successfully!');
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Error resetting data: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/')} style={styles.iconButton}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={styles.headerTitle}>Admin Dashboard</h1>
        </div>
        <div style={styles.headerRight}>
          {/* Firebase connection test */}
          <button 
            onClick={handleTestFirebase} 
            style={{
              ...styles.iconButton,
              backgroundColor: firebaseStatus === 'connected' ? '#22c55e' : 
                               firebaseStatus === 'error' ? '#ef4444' : 
                               firebaseStatus === 'testing' ? '#f59e0b' : '#333',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}
            title={firebaseError || 'Test Firebase connection'}
          >
            <Wifi size={16} />
            {firebaseStatus === 'testing' ? 'Testing...' : 
             firebaseStatus === 'connected' ? 'Connected' :
             firebaseStatus === 'error' ? 'Error' : 'Test Firebase'}
          </button>
          <button 
            onClick={() => loadData()} 
            style={styles.iconButton} 
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleResetData} 
            style={{...styles.iconButton, color: '#ef4444'}} 
            title="Reset graph data from JSON"
          >
            <RotateCcw size={20} />
          </button>
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={() => navigate('/map')} style={styles.iconButton} title="View Map">
            <Eye size={20} />
          </button>
          <button onClick={handleLogout} style={styles.iconButton} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          onClick={() => { setActiveTab('nodes'); resetForm(); }}
          style={{
            ...styles.tab,
            ...(activeTab === 'nodes' ? styles.activeTab : {})
          }}
        >
          <GitBranch size={16} />
          Graph Nodes
        </button>
        <button 
          onClick={() => { setActiveTab('notes'); resetForm(); }}
          style={{
            ...styles.tab,
            ...(activeTab === 'notes' ? styles.activeTab : {})
          }}
        >
          <FileText size={16} />
          Blog Notes
        </button>
      </div>

      <main style={styles.main}>
        {/* List Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>
              {activeTab === 'notes' ? 'Your Notes' : 'Graph Nodes'}
            </h2>
            <button 
              onClick={() => { resetForm(); setShowEditor(true); }} 
              style={styles.addButton}
            >
              <Plus size={18} />
              {activeTab === 'notes' ? 'New Note' : 'New Node'}
            </button>
          </div>

          <div style={styles.itemsList}>
            {activeTab === 'notes' ? (
              // Notes list
              notes.length === 0 ? (
                <p style={styles.emptyMessage}>No notes yet. Create your first note!</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} style={styles.itemCard}>
                    <div style={styles.itemContent}>
                      <h3 style={styles.itemTitle}>{note.title}</h3>
                      <p style={styles.itemPreview}>
                        {note.content?.substring(0, 80)}...
                      </p>
                      <div style={styles.itemTags}>
                        {note.tags?.map((tag, i) => (
                          <span key={i} style={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={styles.itemActions}>
                      <button onClick={() => handleEditNote(note)} style={styles.actionButton}>
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteNote(note.id)} style={styles.deleteButton}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Nodes list
              graphNodes.length === 0 ? (
                <p style={styles.emptyMessage}>No nodes yet. Click "New Node" to add one!</p>
              ) : (
                graphNodes.map(node => (
                  <div key={node.id} style={styles.itemCard}>
                    <div style={styles.itemContent}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: TYPE_COLORS[node.type] || '#888'
                        }} />
                        <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          {node.type}
                        </span>
                      </div>
                      <h3 style={styles.itemTitle}>{node.label || node.name}</h3>
                      {node.summary && (
                        <p style={styles.itemPreview}>
                          {node.summary.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                    <div style={styles.itemActions}>
                      <button onClick={() => handleEditNode(node)} style={styles.actionButton}>
                        <Edit3 size={16} />
                      </button>
                      {node.type !== 'person' && (
                        <button onClick={() => handleDeleteNode(node.id)} style={styles.deleteButton}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Editor Panel */}
        {showEditor && (
          <div style={styles.editorPanel}>
            {activeTab === 'notes' ? (
              // Note editor
              <form onSubmit={handleNoteSubmit} style={styles.form}>
                <h2 style={styles.formTitle}>
                  {editingItem ? 'Edit Note' : 'New Note'}
                </h2>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="My awesome note"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Content (Markdown supported)</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note here..."
                    required
                    style={styles.textarea}
                    rows={10}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="ai, machine-learning, projects"
                    style={styles.input}
                  />
                  <p style={styles.helpText}>
                    Tags connect notes to nodes on your graph
                  </p>
                </div>

                <div style={styles.formActions}>
                  <button type="button" onClick={resetForm} style={styles.cancelButton}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    {editingItem ? 'Update Note' : 'Create Note'}
                  </button>
                </div>
              </form>
            ) : (
              // Node editor
              <form onSubmit={handleNodeSubmit} style={styles.form}>
                <h2 style={styles.formTitle}>
                  {editingItem ? 'Edit Node' : 'New Node'}
                </h2>

                <div style={styles.formGroup}>
                  <label style={styles.label}>ID (unique identifier)</label>
                  <input
                    type="text"
                    value={nodeId}
                    onChange={(e) => setNodeId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="my-node-id"
                    required
                    disabled={!!editingItem}
                    style={{...styles.input, ...(editingItem ? { opacity: 0.5 } : {})}}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Label (display name)</label>
                  <input
                    type="text"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    placeholder="Machine Learning"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                    style={styles.select}
                  >
                    {NODE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Summary / Description</label>
                  <textarea
                    value={nodeSummary}
                    onChange={(e) => setNodeSummary(e.target.value)}
                    placeholder="Describe this node..."
                    style={styles.textarea}
                    rows={6}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={nodeSkills}
                    onChange={(e) => setNodeSkills(e.target.value)}
                    placeholder="Python, PyTorch, NumPy"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Link (optional URL)</label>
                  <input
                    type="url"
                    value={nodeLink}
                    onChange={(e) => setNodeLink(e.target.value)}
                    placeholder="https://github.com/..."
                    style={styles.input}
                  />
                </div>

                {/* Connections / Links Section */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <LinkIcon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Connections (links from this node)
                  </label>
                  
                  {/* Current connections */}
                  <div style={styles.connectionsContainer}>
                    {nodeConnections.length === 0 ? (
                      <span style={styles.noConnections}>No connections yet</span>
                    ) : (
                      nodeConnections.map(targetId => {
                        const targetNode = graphNodes.find(n => n.id === targetId);
                        return (
                          <div key={targetId} style={styles.connectionTag}>
                            <span>{targetNode?.label || targetId}</span>
                            <button
                              type="button"
                              onClick={() => setNodeConnections(nodeConnections.filter(id => id !== targetId))}
                              style={styles.removeConnectionBtn}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Add new connection */}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !nodeConnections.includes(e.target.value)) {
                        setNodeConnections([...nodeConnections, e.target.value]);
                      }
                      e.target.value = '';
                    }}
                    style={styles.select}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add connection to...</option>
                    {graphNodes
                      .filter(n => n.id !== nodeId && !nodeConnections.includes(n.id))
                      .sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))
                      .map(node => (
                        <option key={node.id} value={node.id}>
                          {node.label || node.id} ({node.type})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div style={styles.formActions}>
                  <button type="button" onClick={resetForm} style={styles.cancelButton}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    {editingItem ? 'Update Node' : 'Create Node'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#a0a0a0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#888'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  headerTitle: {
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: 0
  },
  userEmail: {
    color: '#888',
    fontSize: '0.875rem'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s, background 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#888',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s'
  },
  activeTab: {
    color: '#fff',
    borderBottomColor: '#fff'
  },
  main: {
    display: 'flex',
    height: 'calc(100vh - 120px)'
  },
  sidebar: {
    width: '400px',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #2a2a2a'
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 500,
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  itemsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem'
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    border: '1px solid #2a2a2a'
  },
  itemContent: {
    flex: 1,
    minWidth: 0
  },
  itemTitle: {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 500,
    margin: '0 0 0.5rem 0'
  },
  itemPreview: {
    color: '#888',
    fontSize: '0.85rem',
    margin: '0 0 0.5rem 0',
    lineHeight: 1.4
  },
  itemTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  tag: {
    backgroundColor: '#2a2a2a',
    color: '#e07c4c',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem'
  },
  itemActions: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: '1rem'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px'
  },
  editorPanel: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto'
  },
  form: {
    maxWidth: '700px'
  },
  formTitle: {
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    color: '#ccc',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
    fontWeight: 500
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box'
  },
  helpText: {
    color: '#666',
    fontSize: '0.8rem',
    marginTop: '0.5rem'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#888',
    fontSize: '0.95rem',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  connectionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    minHeight: '36px',
    padding: '0.5rem',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    border: '1px solid #2a2a2a'
  },
  noConnections: {
    color: '#555',
    fontSize: '0.85rem',
    fontStyle: 'italic'
  },
  connectionTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 0.6rem',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    fontSize: '0.85rem',
    color: '#a78bfa'
  },
  removeConnectionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    transition: 'color 0.2s'
  }
};
