import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  setDoc,
  writeBatch,
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';
import rawGraphData from '../data/graphData.json';

const NODES_COLLECTION = 'graphNodes';
const LINKS_COLLECTION = 'graphLinks';

// Force reset graph data from JSON (clears existing and re-seeds)
export async function resetGraphData() {
  console.log('Resetting graph data from JSON...');
  
  // Delete all existing nodes
  const nodesSnapshot = await getDocs(collection(db, NODES_COLLECTION));
  for (const docSnap of nodesSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  // Delete all existing links
  const linksSnapshot = await getDocs(collection(db, LINKS_COLLECTION));
  for (const docSnap of linksSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  // Re-seed from JSON
  const batch = writeBatch(db);
  
  for (const node of rawGraphData.nodes) {
    const nodeRef = doc(db, NODES_COLLECTION, node.id);
    batch.set(nodeRef, node);
  }
  
  for (let i = 0; i < rawGraphData.links.length; i++) {
    const link = rawGraphData.links[i];
    const linkRef = doc(collection(db, LINKS_COLLECTION));
    // Ensure we only save source and target as strings
    batch.set(linkRef, { source: link.source, target: link.target });
  }
  
  await batch.commit();
  console.log('Graph data reset successfully!');
}

// Initialize graph data from JSON if Firestore is empty (using batch writes for speed)
export async function initializeGraphData() {
  const nodesSnapshot = await getDocs(collection(db, NODES_COLLECTION));
  
  // If no nodes exist, seed from JSON using batch writes (much faster!)
  if (nodesSnapshot.empty) {
    console.log('Seeding graph data from JSON...');
    
    // Use batched writes - up to 500 operations per batch
    const batch = writeBatch(db);
    
    // Add all nodes in batch
    for (const node of rawGraphData.nodes) {
      const nodeRef = doc(db, NODES_COLLECTION, node.id);
      batch.set(nodeRef, node);
    }
    
    // Add all links in batch
    for (let i = 0; i < rawGraphData.links.length; i++) {
      const link = rawGraphData.links[i];
      const linkRef = doc(collection(db, LINKS_COLLECTION));
      // Ensure we only save source and target as strings
      batch.set(linkRef, { source: link.source, target: link.target });
    }
    
    await batch.commit();
    console.log('Graph data seeded successfully!');
  }
}

// Get all nodes
export async function getGraphNodes() {
  const snapshot = await getDocs(collection(db, NODES_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get all links
export async function getGraphLinks() {
  const snapshot = await getDocs(collection(db, LINKS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get full graph data
export async function getGraphData() {
  const [nodes, links] = await Promise.all([
    getGraphNodes(),
    getGraphLinks()
  ]);
  return { nodes, links };
}

// Create a new node
export async function createNode(node) {
  const nodeId = node.id || `node-${Date.now()}`;
  await setDoc(doc(db, NODES_COLLECTION, nodeId), {
    ...node,
    id: nodeId
  });
  return nodeId;
}

// Update a node
export async function updateNode(nodeId, updates) {
  const docRef = doc(db, NODES_COLLECTION, nodeId);
  await updateDoc(docRef, updates);
}

// Delete a node
export async function deleteNode(nodeId) {
  // Delete the node
  await deleteDoc(doc(db, NODES_COLLECTION, nodeId));
  
  // Also delete any links connected to this node
  const linksSnapshot = await getDocs(collection(db, LINKS_COLLECTION));
  for (const linkDoc of linksSnapshot.docs) {
    const link = linkDoc.data();
    if (link.source === nodeId || link.target === nodeId) {
      await deleteDoc(linkDoc.ref);
    }
  }
}

// Create a link between nodes
export async function createLink(source, target) {
  const docRef = await addDoc(collection(db, LINKS_COLLECTION), { source, target });
  return docRef.id;
}

// Delete a link
export async function deleteLink(linkId) {
  await deleteDoc(doc(db, LINKS_COLLECTION, linkId));
}
