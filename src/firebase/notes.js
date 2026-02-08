import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

const NOTES_COLLECTION = 'notes';

// Get all notes
export async function getNotes() {
  const q = query(collection(db, NOTES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date()
  }));
}

// Get a single note
export async function getNote(id) {
  const docRef = doc(db, NOTES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// Create a new note
export async function createNote(note) {
  const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

// Update a note
export async function updateNote(id, updates) {
  const docRef = doc(db, NOTES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

// Delete a note
export async function deleteNote(id) {
  const docRef = doc(db, NOTES_COLLECTION, id);
  await deleteDoc(docRef);
}

// Convert notes to graph nodes/links format
export function notesToGraphData(notes, existingData) {
  const noteNodes = notes.map(note => ({
    id: `note-${note.id}`,
    label: note.title,
    name: note.title,
    type: 'note',
    val: 8,
    description: note.content,
    tags: note.tags || [],
    date: note.createdAt
  }));

  // Create links from notes to their tagged interests
  const noteLinks = [];
  notes.forEach(note => {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(tag => {
        // Find matching node in existing data
        const matchingNode = existingData.nodes.find(
          n => n.id?.toLowerCase() === tag.toLowerCase() || 
               (n.label && n.label.toLowerCase() === tag.toLowerCase()) ||
               (n.name && n.name.toLowerCase() === tag.toLowerCase())
        );
        if (matchingNode) {
          noteLinks.push({
            source: `note-${note.id}`,
            target: matchingNode.id
          });
        }
      });
    } else {
      // Link orphan notes to the main "hannah" node
      noteLinks.push({
        source: `note-${note.id}`,
        target: 'hannah'
      });
    }
  });

  return {
    nodes: [...existingData.nodes, ...noteNodes],
    links: [...existingData.links, ...noteLinks]
  };
}
