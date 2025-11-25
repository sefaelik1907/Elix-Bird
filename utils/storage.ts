
import { User, LeaderboardEntry } from '../types';
import { db, auth } from '../firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  increment 
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

const SESSION_KEY = 'elixunder_current_session';

// --- Helper: Username Masking ---
export const maskUsername = (email: string): string => {
  const localPart = email.split('@')[0];
  const start = localPart.slice(0, 4);
  const end = localPart.slice(-2);
  return `${start}***${end}`.toLowerCase();
};

// --- Helper: Ensure Auth ---
const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Auth Error:", e);
      // Fallback: If auth fails, the DB calls might fail too depending on rules, 
      // but we continue to try.
    }
  }
};

// --- Firebase Operations ---

export const loginUser = async (email: string) => {
  await ensureAuth(); // Ensure we are authenticated
  
  const lowerEmail = email.toLowerCase();
  const userRef = doc(db, "users", lowerEmail);
  
  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User exists
      const userData = userSnap.data() as User;
      localStorage.setItem(SESSION_KEY, lowerEmail);
      
      return {
        success: true,
        userId: lowerEmail,
        username: userData.username,
        autoLogin: true,
        user: userData
      };
    } else {
      // Create new user
      const newUser: User = {
        email: lowerEmail,
        username: maskUsername(lowerEmail),
        highScore: 0,
        gamesPlayed: 0
      };

      await setDoc(userRef, newUser);
      localStorage.setItem(SESSION_KEY, lowerEmail);

      return {
        success: true,
        email: lowerEmail,
        username: newUser.username,
        autoLoginEnabled: true,
        user: newUser
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false };
  }
};

export const autoLogin = async () => {
  await ensureAuth(); // Ensure auth on reload
  const sessionEmail = localStorage.getItem(SESSION_KEY);
  if (!sessionEmail) return null;
  return await loginUser(sessionEmail);
};

export const saveScore = async (email: string, score: number) => {
  await ensureAuth();
  
  const lowerEmail = email.toLowerCase();
  const userRef = doc(db, "users", lowerEmail);

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      const isNewRecord = score > userData.highScore;
      
      // Update DB
      if (isNewRecord) {
        await updateDoc(userRef, {
          highScore: score,
          gamesPlayed: increment(1)
        });
      } else {
        await updateDoc(userRef, {
          gamesPlayed: increment(1)
        });
      }

      return { 
          success: true, 
          isNewRecord, 
          currentHighScore: isNewRecord ? score : userData.highScore 
      };
    }
    return { success: false };
  } catch (error) {
    console.error("Save score error:", error);
    return { success: false };
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  await ensureAuth();
  
  try {
    const q = query(collection(db, "users"), orderBy("highScore", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as User;
      entries.push({
        username: data.username,
        score: data.highScore
      });
    });
    
    return entries;
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }
};

export const getCurrentUserRank = async (email: string): Promise<number> => {
  await ensureAuth();
  try {
    const leaderboard = await getLeaderboard();
    const index = leaderboard.findIndex(u => {
        return u.username === maskUsername(email);
    });
    return index !== -1 ? index + 1 : 0;
  } catch (error) {
    return 0;
  }
};

export const getAllUsersForAdmin = async (): Promise<User[]> => {
  await ensureAuth();
  
  try {
    const q = query(collection(db, "users"), orderBy("highScore", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    
    return users;
  } catch (error) {
    console.error("Admin fetch error:", error);
    return [];
  }
};
