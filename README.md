# Phonics Flashcard

App học phonics tiếng Anh bằng flashcard + spaced repetition (SM-2). Dữ liệu lưu
trong localStorage của trình duyệt — không backend, không login.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

Lần đầu mở app đã có sẵn data mẫu: 5 nguyên âm + 5 phụ âm (≈33 cách viết).

Scripts khác:

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit test cho SM-2
npm run build       # typecheck + build ra dist/
npm run preview     # xem thử bản build
```

## Cách dùng

- **Học** (`/study`): Space lật thẻ, `1/2/3/4` = Sai / Khó / Tốt / Dễ. Hai chế độ:
  *Cách viết → âm* và *Âm → cách viết*. Trả lời **Sai** hoặc **Khó** thì thẻ quay
  lại cuối phiên (SM-2 vẫn tính Khó là đúng khi xếp lịch ôn — chỉ phiên hiện tại
  mới lặp lại).
- **Quản lý** (`/manage`): CRUD âm / cách viết / từ ví dụ, nhập nhanh, export & import.
- **Thống kê** (`/stats`): số thẻ cần ôn, % thuộc, top 5 cách viết sai nhiều nhất.

Progress % = (số cách viết đã "thuộc") / (tổng số cách viết). "Thuộc" =
`repetitions >= 3` và `interval >= 7` ngày, nên trả lời sai (reset repetitions) sẽ
làm % tụt xuống.

### Nhập nhanh

Mỗi dòng một âm, dạng `IPA | vowel|consonant | cách-viết: ví dụ, ví dụ | ...`:

```
/æ/ | vowel | a: cat, hat | ai: plaid
/f/ | consonant | f: fan | ph: phone, graph
```

Âm đã tồn tại (khớp IPA) sẽ được gộp thêm cách viết / ví dụ, không ghi đè và
không mất tiến độ ôn tập. Dòng bắt đầu bằng `#` bị bỏ qua.

## Backup dữ liệu

- **Export**: `/manage` → **Export JSON** → tải file `phonics-backup-YYYY-MM-DD.json`
  (gồm cả tiến độ ôn tập).
- **Import**: `/manage` → **Import JSON** → chọn file. Lưu ý: import **ghi đè**
  toàn bộ dữ liệu hiện tại. Muốn gộp thêm âm mới thì dùng Nhập nhanh.
- Dữ liệu nằm ở localStorage key `phonics-flashcard:v1`. Xoá site data của
  trình duyệt = mất dữ liệu, nên export định kỳ.
- Mang sang máy khác: Export ở máy A → Import ở máy B.

## Deploy Netlify

**Cách 1 — kéo thả (nhanh nhất):**

```bash
npm run build
```

Mở [app.netlify.com/drop](https://app.netlify.com/drop) rồi kéo thẳng thư mục
`dist/` vào. Xong. (`dist/_redirects` được copy từ `public/` nên refresh ở
`/manage` không bị 404.)

**Cách 2 — connect Git repo (tự deploy mỗi lần push):**

1. Push repo này lên GitHub.
2. Netlify → **Add new site** → **Import an existing project** → chọn repo.
3. Build settings để mặc định — `netlify.toml` đã khai báo sẵn:
   build command `npm run build`, publish `dist`, Node 20, SPA redirect.
4. **Deploy**. Mỗi lần push vào `main` là Netlify build lại.

Không cần env var, không cần plugin.

## Cấu trúc

```
src/
├── components/   Flashcard, ProgressBar, ThemeToggle, PhonemeManager, BulkImport
├── hooks/        useStore (localStorage + context), useStudyQueue, useDarkMode
├── lib/          sm2.ts (+ test), storage.ts, seed.ts, types.ts
└── pages/        StudyPage, ManagePage, StatsPage
```

Ghi chú kỹ thuật:

- `sm2.ts` là pure function, nhận `today` làm tham số nên test được deterministic.
- Thẻ = một grapheme (cách viết); review state gắn vào grapheme, hai chế độ học
  chỉ đổi mặt trước/sau chứ không nhân đôi tiến độ.
- Queue ưu tiên: overdue (quá hạn lâu nhất trước) → thẻ mới → due trong 1–3 ngày.
  Ngưỡng lặp lại trong phiên nằm ở `useStudyQueue.ts` (`grade < 4`), tách rời khỏi
  ngưỡng pass/fail của SM-2 (`grade >= 3`).
- Dark mode: class `dark` được set trong `<script>` ở `index.html` trước khi React
  mount nên không bị flash; lưu ở localStorage key `phonics-flashcard:theme`, lần
  đầu theo `prefers-color-scheme`.
- localStorage lưu dạng `{ version, data }` để `storage.ts` migrate được về sau.
