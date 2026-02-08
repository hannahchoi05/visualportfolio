// Quick Firebase connection test
// Run this in browser console or add to a component

import { db } from './config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  const startTime = Date.now();
  
  try {
    // Test 1: Try to read from a test collection
    console.log('📖 Test 1: Reading from Firestore...');
    const testCollection = collection(db, 'connectionTest');
    const snapshot = await getDocs(testCollection);
    console.log(`✅ Read successful! Found ${snapshot.size} documents. Time: ${Date.now() - startTime}ms`);
    
    // Test 2: Try to write to Firestore
    console.log('✏️ Test 2: Writing to Firestore...');
    const writeStart = Date.now();
    const docRef = await addDoc(testCollection, {
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Write successful! Doc ID: ${docRef.id}. Time: ${Date.now() - writeStart}ms`);
    
    return { success: true, readTime: Date.now() - startTime };
  } catch (error) {
    console.error('❌ Firebase error:', error.code, error.message);
    return { success: false, error: error.message, code: error.code };
  }
}

// Export for easy testing
window.testFirebase = testFirebaseConnection;
