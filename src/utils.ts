import type { Expense, TempEdit } from "./types";
import { auth, db } from "./firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { seedExpensesIfEmpty } from "./dev/seed";

export const formatMoney = (n: string | number, currency = "USD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
};

export async function signUp(
  email: string,
  password: string,
  seed: boolean = true
) {
  try {
    //TODO : Implement firebase email sign up functionality
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isLocal =
      typeof window !== "undefined" && location.hostname === "localhost";

    if (isLocal && cred && seed) {
      await seedExpensesIfEmpty(cred.user.uid, 100);
    }

    //TODO: Return cred.user on success and Error on failure
    if (cred) return cred.user;
    // throw Error("Signup not implemented");
  } catch (error) {
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    //TODO : Implement firebase email sign in functionality, similar to signUp function above
    const cred = await signInWithEmailAndPassword(auth, email, password);
    //TODO: Return cred.user on success and Error on failure
    if (cred) return cred.user;
    // throw Error("Sign in not implemented");
  } catch (e: any) {
    throw e;
  }
}

export async function signOut() {
  if (!auth.currentUser) return;

  try {
    //TODO: Use the firebase signOut function to sign out the current user and comment out the throw statement
    await fbSignOut(auth);
    // throw Error("Sign out not implemented");
  } catch (e: any) {
    const err = new Error(
      e?.message || "Failed to sign out. Please try again."
    ) as Error & {
      code?: string;
    };
    if (e?.code) err.code = e.code;
    throw err;
  }
}

export function onAuthChanged(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = await getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    window.location.assign("/signin");
    throw new Error("Unauthorized");
  }
  return res;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

function expensesCol(uid: string) {
  return collection(db, "users", uid, "expenses");
}

export const fetchExpenses = async (): Promise<Expense[] | {}> => {
  const uid = requireUid();
  //TODO: Implement the query to fetch the list of expenses from Firestore for the currently signed-in user
  const q = query(expensesCol(uid), where("deleted", "!=", true) , orderBy("date", "desc"));
  //TODO: Use the getDocs function to execute the query and get the snapshot
  const snap = await getDocs(q);

  const list: Expense[] | {} = snap.docs.map((d) => {
    const x = d.data() as any;

    //TODO: Map the fetched document to Expense type and return the list of expenses
    return {
      id: d.id,
      description: x.description,
      cost: x.cost,
      date: x.date,
      deleted: x.deleted || false,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    } as Expense;
  }).filter((e) => !e.deleted);
  return list;
};

export const addExpense = async (expense: Omit<Expense, "id">) => {
  try {
    const uid = requireUid();

    if (!expense.description) {
      throw new Error("Description is required");
    }
    if (isNaN(Number(expense.cost)) || Number(expense.cost) < 0) {
      throw new Error("Enter a valid non-negative cost");
    }
    //TODO: Implement the function add a new expense document to Firestore using the payload
    const payload = {
      uid: uid,
      description: expense.description,
      cost: Number(expense.cost),
      date: expense.date,
      deleted: expense.deleted || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    //TODO: Use the addDoc function to add the document to Firestore
    await addDoc(expensesCol(uid), payload);
  } catch (error) {
    throw error;
  }
};

export const updateExpense = async (
  id: string | number,
  next: Partial<Expense> | TempEdit
) => {
  const uid = requireUid();
  //TODO: Get the document reference for the expense to be updated
  const ref = doc(db, "users", uid, "expenses", String(id));

  const body: any = {};
  if (next.description !== undefined) body.description = next.description;
  if (next.date !== undefined) body.date = next.date;
  if ((next as any).cost !== undefined) body.cost = Number((next as any).cost);
  if ((next as any).deleted !== undefined)
    body.deleted = !!(next as any).deleted;
  //TODO: Use the updateDoc function to update the expense document in Firestore

  body.updatedAt = serverTimestamp();
  await updateDoc(ref, body);
};

export const deleteExpense = async (id: string | number) => {
  const uid = requireUid();
  const ref = doc(db, "users", uid, "expenses", String(id));
  //TODO : Implement soft delete of expense
  await updateDoc(ref, {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
};
