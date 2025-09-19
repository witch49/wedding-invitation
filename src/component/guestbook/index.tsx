import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "../button"
import { dayjs } from "../../const"
import { LazyDiv } from "../lazyDiv"
import { useModal } from "../modal"
import offlineGuestBook from "./offlineGuestBook.json"
import { db, ensureAnonymousAuth, serverTimestamp, isFirebaseConfigured } from "../../firebase"
import { 
  collection,
  addDoc,
  query as firestoreQuery,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  getDocs,
  where as firestoreWhere,
  deleteDoc,
  doc as firestoreDoc,
} from "firebase/firestore"

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

export const GuestBook = () => {
  const { openModal, closeModal } = useModal()

  const [posts, setPosts] = useState<Post[]>([])

  const loadPosts = async () => {
    if (isFirebaseConfigured) {
      // --- Firebase path: read latest 3 documents from 'guestbook' collection ---
      try {
        // ensure anonymous auth (so Firestore rules that require auth pass)
        await ensureAnonymousAuth()

        const q = firestoreQuery(
          collection(db, "guestbook"),
          firestoreOrderBy("createdAt", "desc"),
          firestoreLimit(3),
        )
        const snap = await getDocs(q)
        const docs = snap.docs.map((d) => {
          const data = d.data() as any
          return {
            id: data.id ?? Number(d.id) ?? Date.now(),
            timestamp: data.timestamp ?? Math.floor((data.createdAt?.seconds ?? Date.now() / 1000)),
            name: data.name ?? "익명",
            content: data.content ?? "",
          } as Post
        })
        setPosts(docs)
      } catch (err) {
        console.error("Firebase loadPosts error:", err)
        // fallback to offline
      }
    } else {
      setPosts(offlineGuestBook.slice(0, 3))
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  return (
    <LazyDiv className="card guestbook">
      <h2 className="english">Guest Book</h2>

      <div className="break" />

      {posts.map((post) => (
        <div key={post.id} className="post">
          <div className="heading">
            <button
              className="close-button"
              onClick={async () => {
                if (isFirebaseConfigured) {
                  openModal({
                    className: "delete-guestbook-modal",
                    closeOnClickBackground: false,
                    header: <div className="title">삭제하시겠습니까?</div>,
                    content: (
                      <DeleteGuestBookModal
                        postId={post.id}
                        onSuccess={() => {
                          loadPosts()
                        }}
                      />
                    ),
                    footer: (
                      <>
                        <Button
                          buttonStyle="style2"
                          type="submit"
                          form="guestbook-delete-form"
                        >
                          삭제하기
                        </Button>
                        <Button
                          buttonStyle="style2"
                          className="bg-light-grey-color text-dark-color"
                          onClick={closeModal}
                        >
                          닫기
                        </Button>
                      </>
                    ),
                  })
                }
              }}
            />
          </div>
          <div className="body">
            <div className="title">
              <div className="name">{post.name}</div>
              <div className="date">
                {dayjs.unix(post.timestamp).format("YYYY-MM-DD")}
              </div>
            </div>
            <div className="content">{post.content}</div>
          </div>
        </div>
      ))}

      <div className="break" />

      {isFirebaseConfigured && (
        <>
          <Button
            onClick={() =>
              openModal({
                className: "write-guestbook-modal",
                closeOnClickBackground: false,
                header: (
                  <div className="title-group">
                    <div className="title">방명록 작성하기</div>
                    <div className="subtitle">
                      신랑, 신부에게 축하의 마음을 전해주세요.
                    </div>
                  </div>
                ),
                content: <WriteGuestBookModal loadPosts={loadPosts} />,
                footer: (
                  <>
                    <Button
                      buttonStyle="style2"
                      type="submit"
                      form="guestbook-write-form"
                    >
                      저장하기
                    </Button>
                    <Button
                      buttonStyle="style2"
                      className="bg-light-grey-color text-dark-color"
                      onClick={closeModal}
                    >
                      닫기
                    </Button>
                  </>
                ),
              })
            }
          >
            방명록 작성하기
          </Button>
          <div className="break" />
        </>
      )}

      <Button
        onClick={() =>
          openModal({
            className: "all-guestbook-modal",
            closeOnClickBackground: true,
            header: <div className="title">방명록 전체보기</div>,
            content: <AllGuestBookModal loadPosts={loadPosts} />,
            footer: (
              <Button
                buttonStyle="style2"
                className="bg-light-grey-color text-dark-color"
                onClick={closeModal}
              >
                닫기
              </Button>
            ),
          })
        }
      >
        방명록 전체보기
      </Button>
    </LazyDiv>
  )
}

/** --- Helper: password hash (SHA-256) --- **/
async function hashPassword(password: string) {
  if (typeof window === "undefined" || !("crypto" in window) || !crypto.subtle) {
    // fallback: simple (less secure) hash if SubtleCrypto unavailable
    let h = 0
    for (let i = 0; i < password.length; i++) {
      h = (h << 5) - h + password.charCodeAt(i)
      h |= 0
    }
    return String(h)
  }
  const enc = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(password))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

const WriteGuestBookModal = ({ loadPosts }: { loadPosts: () => void }) => {
  const inputRef = useRef({}) as React.RefObject<{
    name: HTMLInputElement
    content: HTMLTextAreaElement
    password: HTMLInputElement
  }>
  const { closeModal } = useModal()
  const [loading, setLoading] = useState(false)

  return (
    <form
      id="guestbook-write-form"
      className="form"
      onSubmit={async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
          const name = inputRef.current.name.value.trim()
          const content = inputRef.current.content.value.trim()
          const password = inputRef.current.password.value

          if (!name) {
            alert("이름을 입력해주세요.")
            setLoading(false)
            return
          }
          if (name.length > RULES.name.maxLength) {
            alert(`이름을 ${RULES.name.maxLength}자 이하로 입력해주세요.`)
            setLoading(false)
            return
          }

          if (!content) {
            alert("내용을 입력해주세요.")
            setLoading(false)
            return
          }
          if (content.length > RULES.content.maxLength) {
            alert(`내용을 ${RULES.content.maxLength}자 이하로 입력해주세요.`)
            setLoading(false)
            return
          }

          if (password.length < RULES.password.minLength) {
            alert(`비밀번호를 ${RULES.password.minLength}자 이상 입력해주세요.`)
            setLoading(false)
            return
          }
          if (password.length > RULES.password.maxLength) {
            alert(`비밀번호를 ${RULES.password.maxLength}자 이하로 입력해주세요.`,)
            setLoading(false)
            return
          }

        if (isFirebaseConfigured) {
          await ensureAnonymousAuth()
          const pwHash = await hashPassword(password)
          const id = Date.now() // numeric id to match existing expectation
          await addDoc(collection(db, "guestbook"), {
            id,
            timestamp: Math.floor(Date.now() / 1000),
            name,
            content,
            passwordHash: pwHash,
            createdAt: serverTimestamp(),
          })
        }

          alert("방명록 작성이 완료되었습니다.")
          closeModal()
          loadPosts()
        } catch {
          alert("방명록 작성에 실패했습니다.")
        } finally {
          setLoading(false)
        }
      }}
    >
      이름
      <input
        disabled={loading}
        type="text"
        placeholder="이름을 입력해주세요."
        className="name"
        ref={(ref) => (inputRef.current.name = ref as HTMLInputElement)}
        maxLength={RULES.name.maxLength}
      />
      내용
      <textarea
        disabled={loading}
        placeholder="축하 메세지를 100자 이내로 입력해주세요."
        className="content"
        ref={(ref) => (inputRef.current.content = ref as HTMLTextAreaElement)}
        maxLength={RULES.content.maxLength}
      />
      비밀번호
      <input
        disabled={loading}
        type="password"
        placeholder="비밀번호를 입력해주세요."
        className="password"
        ref={(ref) => (inputRef.current.password = ref as HTMLInputElement)}
        maxLength={RULES.password.maxLength}
      />
    </form>
  )
}

const AllGuestBookModal = ({
  loadPosts,
}: {
  loadPosts: () => Promise<void>
}) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const { openModal, closeModal } = useModal()

  const loadPage = async (page: number) => {
    setCurrentPage(page)
    if (isFirebaseConfigured) {
      try {
        await ensureAnonymousAuth()
    
        // load ALL guestbook docs (small data assumption)
        const qAll = firestoreQuery(
          collection(db, "guestbook"),
          firestoreOrderBy("createdAt", "desc")
        )
        const snapAll = await getDocs(qAll)
        const allDocs = snapAll.docs.map((d) => {
          const data = d.data() as any
          return {
            id: data.id ?? Number(d.id) ?? Date.now(),
            timestamp: data.timestamp ?? Math.floor((data.createdAt?.seconds ?? Date.now() / 1000)),
            name: data.name ?? "익명",
            content: data.content ?? "",
          } as Post
        })
    
        // compute pagination
        const total = allDocs.length
        const pages = Math.ceil(total / POSTS_PER_PAGE)
        setTotalPages(pages)
    
        // slice the page we need
        const start = page * POSTS_PER_PAGE
        const pageDocs = allDocs.slice(start, start + POSTS_PER_PAGE)
    
        setPosts(pageDocs)
        // adjust current page if out of range
        if (page >= pages && pages > 0) {
          setCurrentPage(pages - 1)
        }
      } catch (err) {
        console.error("Firebase loadPage error:", err)
      }
    } else {
      setCurrentPage(page)

      setPosts(
        offlineGuestBook.slice(
          page * POSTS_PER_PAGE,
          (page + 1) * POSTS_PER_PAGE,
        ),
      )
      setTotalPages(Math.ceil(offlineGuestBook.length / POSTS_PER_PAGE))
    }
  }

  useEffect(() => {
    loadPage(0)
  }, [])

  const pages = useMemo(() => {
    const start = Math.floor(currentPage / PAGES_PER_BLOCK) * PAGES_PER_BLOCK
    const end = Math.min(start + PAGES_PER_BLOCK, totalPages)

    return Array.from({ length: end - start }).map((_, index) => index + start)
  }, [currentPage, totalPages])

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="post">
          <div className="heading">
            <div
              className="close-button"
              onClick={async () => {
                if (isFirebaseConfigured) {
                  openModal({
                    className: "delete-guestbook-modal",
                    closeOnClickBackground: false,
                    header: <div className="title">삭제하시겠습니까?</div>,
                    content: (
                      <DeleteGuestBookModal
                        postId={post.id}
                        onSuccess={() => {
                          loadPosts()
                          loadPage(currentPage)
                        }}
                      />
                    ),
                    footer: (
                      <>
                        <Button
                          buttonStyle="style2"
                          type="submit"
                          form="guestbook-delete-form"
                        >
                          삭제하기
                        </Button>
                        <Button
                          buttonStyle="style2"
                          className="bg-light-grey-color text-dark-color"
                          onClick={closeModal}
                        >
                          닫기
                        </Button>
                      </>
                    ),
                  })
                }
            }}
           />
          </div>
          <div className="body">
            <div className="title">
              <div className="name">{post.name}</div>
              <div className="date">
                {dayjs.unix(post.timestamp).format("YYYY-MM-DD")}
              </div>
            </div>
            <div className="content">{post.content}</div>
          </div>
        </div>
      ))}

      <div className="break" />

      <div className="pagination">
        {pages[0] > 0 && (
          <div
            className="page"
            onClick={() => {
              loadPage(pages[0] - 1)
            }}
          >
            이전
          </div>
        )}
        {pages.map((page) => (
          <div
            className={`page${page === currentPage ? " current" : ""}`}
            key={page}
            onClick={() => {
              if (page === currentPage) return
              loadPage(page)
            }}
          >
            {page + 1}
          </div>
        ))}
        {pages[pages.length - 1] < totalPages - 1 && (
          <div
            className="page"
            onClick={() => {
              loadPage(pages[pages.length - 1] + 1)
            }}
          >
            다음
          </div>
        )}
      </div>
    </>
  )
}

/** --- Delete modal: either server PUT or Firestore delete (with pw hash compare) --- **/
const DeleteGuestBookModal = ({
  postId,
  onSuccess,
}: {
  postId: number
  onSuccess: () => void
}) => {
  const inputRef = useRef({} as HTMLInputElement)
  const { closeModal } = useModal()
  const [loading, setLoading] = useState(false)

  return (
    <form
      id="guestbook-delete-form"
      className="form"
      onSubmit={async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
          const password = inputRef.current.value
          if (!password || password.length < RULES.password.minLength) {
            alert(`비밀번호를 ${RULES.password.minLength}자 이상 입력해주세요.`)
            setLoading(false)
            return
          }

          if (password.length > RULES.password.maxLength) {
            alert(`비밀번호를 ${RULES.password.maxLength}자 이하로 입력해주세요.`,)
            setLoading(false)
            return
          }

        if (isFirebaseConfigured) {
            await ensureAnonymousAuth()
            const pwHash = await hashPassword(password)
            const q = firestoreQuery(
              collection(db, "guestbook"),
              firestoreWhere("id", "==", postId),
              firestoreLimit(1),
            )
            const snap = await getDocs(q)
            if (snap.empty) {
              alert("해당 방명록을 찾을 수 없습니다.")
              setLoading(false)
              return
            }
            const docSnap = snap.docs[0]
            const data = docSnap.data() as any
            if ((data.passwordHash ?? "") !== pwHash) {
              alert("비밀번호가 일치하지 않습니다.")
              setLoading(false)
              return
            }
            // delete
            await deleteDoc(firestoreDoc(db, "guestbook", docSnap.id))
          }

          alert("삭제되었습니다.")
          closeModal()
          onSuccess()
        } catch {
          alert("방명록 삭제에 실패했습니다.")
        } finally {
          setLoading(false)
        }
      }}
    >
      <input
        disabled={loading}
        type="password"
        placeholder="비밀번호를 입력해주세요."
        className="password"
        ref={inputRef}
        maxLength={RULES.password.maxLength}
      />
    </form>
  )
}
