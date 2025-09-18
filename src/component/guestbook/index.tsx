import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../button"
import { dayjs } from "../../const"
import { LazyDiv } from "../lazyDiv"
import { useModal } from "../modal"
import offlineGuestBook from "./offlineGuestBook.json"
import { SERVER_URL } from "../../env"
import { db, ensureAnonymousAuth, serverTimestamp, collection, addDoc, query, orderBy, onSnapshot, DocumentData } from "../../firebase"

const RULES = {
  name: {
    maxLength: 10,
  },
  content: {
    maxLength: 100,
  },
  password: {
    minLength: 4,
    maxLength: 20,
  },
}

const PAGES_PER_BLOCK = 5
const POSTS_PER_PAGE = 5

type Post = {
  id: number
  timestamp: number
  name: string
  content: string
}

type Entry = {
  id: string;
  name: string;
  message: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

export default function Guestbook(): JSX.Element {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ensureAnonymousAuth();

    const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs: Entry[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        docs.push({
          id: d.id,
          name: data.name ?? "익명",
          message: data.message ?? "",
          createdAt: data.createdAt ?? null,
        });
      });
      setEntries(docs);
    }, (err) => {
      console.error("Guestbook snapshot error:", err);
    });

    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "guestbook"), {
        name: name.trim() || "익명",
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setMessage("");
      setName("");
    } catch (err) {
      console.error("write failed", err);
      alert("저장에 실패했습니다. 콘솔을 확인하세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>방명록</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          maxLength={50}
          style={{ padding: "8px 10px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd" }}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="축하 메시지 남기기"
          maxLength={1000}
          rows={4}
          style={{ padding: 10, fontSize: 14, borderRadius: 6, border: "1px solid #ddd", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting} style={{ padding: "8px 12px", borderRadius: 6 }}>
            {submitting ? "등록중..." : "등록"}
          </button>
          <button
            type="button"
            onClick={() => { setName(""); setMessage(""); }}
            style={{ padding: "8px 12px", borderRadius: 6, background: "#f5f5f5" }}
          >
            취소
          </button>
        </div>
      </form>

      <div>
        {entries.length === 0 ? (
          <div style={{ color: "#666" }}>아직 등록된 메시지가 없습니다.</div>
        ) : (
          entries.map((e) => (
            <article key={e.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{e.name}</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{e.message}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                {e.createdAt ? new Date(e.createdAt.seconds * 1000).toLocaleString() : "곧 표시됩니다."}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
