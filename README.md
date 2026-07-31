# Phonics Flashcard

App học phonics tiếng Anh: gõ lại tất cả cách viết của một âm, chấm điểm tự động,
lịch ôn theo spaced repetition (SM-2). Dữ liệu lưu trong localStorage của trình
duyệt — không backend, không login, không đồng bộ.

- [Setup](#setup)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Cách học](#cách-học)
- [Cách tính điểm](#cách-tính-điểm)
- [Thuật toán SM-2 & lịch ôn](#thuật-toán-sm-2--lịch-ôn)
- [Thứ tự thẻ trong phiên](#thứ-tự-thẻ-trong-phiên)
- [Progress % và định nghĩa "thuộc"](#progress--và-định-nghĩa-thuộc)
- [Trang quản lý & nhập nhanh](#trang-quản-lý--nhập-nhanh)
- [Trang thống kê](#trang-thống-kê)
- [Backup dữ liệu](#backup-dữ-liệu)
- [Dark mode](#dark-mode)
- [Deploy Netlify](#deploy-netlify)
- [Cấu trúc code](#cấu-trúc-code)
- [Muốn đổi hành vi thì sửa ở đâu](#muốn-đổi-hành-vi-thì-sửa-ở-đâu)

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

Lần đầu mở app đã có sẵn data mẫu: 5 nguyên âm + 5 phụ âm (≈33 cách viết).

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit test cho sm2.ts + storage.ts (35 test)
npm run test:watch  # vitest watch mode
npm run build       # typecheck + build ra dist/
npm run preview     # xem thử bản build
```

## Mô hình dữ liệu

Ba tầng lồng nhau, lưu thành **một** key trong localStorage.

```
Phoneme  (nhóm âm)          id, type: 'vowel'|'consonant', note?
└── Grapheme (cách viết)    id, spelling, examples: string[]
    └── ReviewState         lastReviewed, interval, easeFactor, repetitions,
                            nextDue, correctCount, wrongCount
```

Ba điều cần nhớ:

1. **Không có trường IPA.** Một `Phoneme` chỉ là *nhóm các cách viết cùng âm*.
2. **`note` chính là nhãn của nhóm và cũng là đề bài khi học** (vd `a ngắn (cat)`).
   Nó tuỳ chọn, nhưng nhóm không có ghi chú thì lúc học chỉ hiện
   *"(nhóm chưa có ghi chú)"* — không có gì để đoán. Nên luôn đặt ghi chú.
3. **Tiến độ ôn gắn vào từng cách viết, không gắn vào nhóm.** Nhóm chỉ là đơn vị
   khi học.

Ngày tháng lưu dạng chuỗi `"YYYY-MM-DD"` (không có giờ, không timezone).

## Cách học

Trang `/study`. Đơn vị học là **một nhóm âm**, không phải một cách viết.

**Bước 1 — gõ cách viết**

- Đề bài: ghi chú của nhóm + loại (nguyên âm / phụ âm) + số cách viết cần tìm.
- Gõ từng cách viết, **Enter** sau mỗi cái.
  - Đúng → chip xanh `✓ a`
  - Không khớp cách viết nào → chip đỏ gạch ngang. **Không bị trừ điểm** (nó không
    ứng với thẻ nào cả), chỉ để bạn thấy mình đã thử gì.
  - Gõ lại cái đã đúng → bỏ qua, không tính thêm.
- Bộ đếm `đã đúng 2/4` cho biết còn thiếu bao nhiêu.

**Bước 2 — kiểm tra**

Bấm **Kiểm tra →** hoặc **Enter khi ô nhập đang trống**. App hiện toàn bộ đáp án:

- cách viết gõ đúng: dấu ✓ xanh
- cách viết còn thiếu: dấu ✗ đỏ, **kèm luôn các từ ví dụ của nó** để học ngay

**Bước 3 — gõ từ ví dụ**

Với mỗi cách viết đã gõ đúng, có ô nhập để gõ từ ví dụ (`cat`, `hat`, …). Gõ đúng
→ chip xanh, còn thiếu bao nhiêu hiện bên cạnh. Bí thì bấm **hiện đáp án** cho
riêng dòng đó (không ảnh hưởng điểm — điểm chỉ tính theo số ví dụ bạn đã gõ được
trước đó).

Nhãn điểm (`Sai` / `Khó` / `Tốt`) cập nhật **ngay khi bạn gõ**, nên thấy trước
mình sẽ được mấy điểm.

**Bước 4 — chấm**

Bấm **Chấm & thẻ tiếp**: ghi điểm cho *mọi* cách viết trong nhóm, cập nhật lịch
ôn, sang nhóm tiếp theo.

### Quy tắc so khớp

- Không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối: gõ `  CAT ` khớp `cat`.
- Ngoài hai điều trên là **so khớp tuyệt đối** — sai một chữ là không khớp, không
  có fuzzy match, không bỏ qua dấu.

### Bàn phím

| Phím | Tác dụng |
| --- | --- |
| `Enter` (ô có chữ) | thêm câu trả lời |
| `Enter` (ô trống) | chuyển sang bước kiểm tra |
| `Tab` | nhảy giữa các ô nhập ví dụ |

Không còn phím `Space` / `1` `2` `3` `4` như bản thẻ lật cũ — điểm giờ tự chấm.

## Cách tính điểm

Không có nút tự đánh giá. Điểm suy ra từ những gì bạn gõ, tính **riêng cho từng
cách viết** trong nhóm:

| Kết quả gõ | Điểm | Nhãn |
| --- | --- | --- |
| Đúng cách viết **+ ít nhất 1 từ ví dụ** | 4 | Tốt |
| Đúng cách viết, **không gõ được ví dụ nào** | 3 | Khó |
| **Thiếu** cách viết (không gõ ra) | 1 | Sai |
| Đúng cách viết, mà cách viết đó **chưa có ví dụ nào trong dữ liệu** | 4 | Tốt |

Dòng cuối là chủ ý: không thể trừ điểm vì thiếu dữ liệu mà chính bạn chưa nhập.

Hàm quyết định là `gradeFromTyping` trong `src/lib/sm2.ts` (có unit test).

### Lặp lại trong phiên

Nhóm nào có **ít nhất một cách viết bị điểm dưới 4** sẽ được đẩy về **cuối queue
của phiên hiện tại**. Tức là cả `Sai` và `Khó` đều làm nhóm quay lại.

Lượt sau, cả nhóm được chấm lại từ đầu (kể cả những cách viết lần trước đã đúng),
và **lần trả lời cuối cùng là lần quyết định lịch ôn**. Vòng lặp tự kết thúc vì
sau bước kiểm tra bạn đã thấy hết đáp án.

## Thuật toán SM-2 & lịch ôn

Toàn bộ nằm trong `src/lib/sm2.ts`, viết dạng pure function (nhận `today` làm tham
số nên test được deterministic).

**1. Cập nhật độ dễ (ease factor)** — áp dụng ở *mọi* mức điểm, kể cả khi sai:

```
new_ease = max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
```

| grade | thay đổi ease | ease từ 2.5 thành |
| --- | --- | --- |
| 5 (Dễ) | +0.10 | 2.60 |
| 4 (Tốt) | 0 | 2.50 |
| 3 (Khó) | −0.14 | 2.36 |
| 1 (Sai) | −0.54 | 1.96 |

Sàn cứng 1.3 — ease không bao giờ xuống dưới mức này.

**2. Cập nhật khoảng cách ôn (interval)**

Đạt (`grade >= 3`):

| Lần đúng thứ | interval mới |
| --- | --- |
| 1 | 1 ngày |
| 2 | 6 ngày |
| 3 trở đi | `round(interval_cũ * new_ease)` |

Lưu ý: nhân với ease **mới**, không phải ease cũ.

Không đạt (`grade < 3`, tức grade 1):

```
repetitions = 0        // mất hết chuỗi đúng
interval = 1           // ôn lại ngày mai
```

**3. Ngày ôn kế tiếp**

```
nextDue = today + interval
lastReviewed = today
correctCount += 1   (nếu grade >= 3)
wrongCount   += 1   (nếu grade < 3)
```

Ví dụ một chuỗi trả lời Tốt (grade 4, ease giữ 2.5) từ thẻ mới:
`1 ngày → 6 ngày → 15 ngày → 38 ngày → 95 ngày …`

Một lần Sai duy nhất đưa nó về `1 ngày` và `repetitions = 0`.

> Grade 5 không còn được phát ra khi học (chấm tự động chỉ dùng 1 / 3 / 4), nhưng
> `review()` vẫn xử lý đúng grade 5 và vẫn có test — để sau này thêm lại dễ.

## Thứ tự thẻ trong phiên

Queue được **chốt một lần khi vào phiên** (`/study`), nên chấm điểm giữa phiên
không làm xáo trộn phần còn lại.

Thứ tự ưu tiên, xét theo từng cách viết:

1. **Quá hạn / đến hạn hôm nay** (`nextDue <= hôm nay`) — quá hạn lâu nhất lên trước
2. **Thẻ mới** (`nextDue === null`, chưa học lần nào)
3. **Sắp đến hạn trong 1–3 ngày** — gần hạn hơn lên trước
4. Đến hạn xa hơn 3 ngày: **không đưa vào phiên**

Nhóm thì thừa hưởng ưu tiên của cách viết gấp nhất trong nhóm
(`buildGroupQueue` chỉ dedupe `buildQueue` theo nhóm nên thứ tự khớp nhau).

Học hết queue → hiện *"Hết thẻ cần ôn hôm nay"* + nút **Học lại phiên mới** (dựng
lại queue, không đợi đến mai).

## Progress % và định nghĩa "thuộc"

```
% = (số cách viết đã "thuộc") / (tổng số cách viết) * 100     // làm tròn
"thuộc" = repetitions >= 3  VÀ  interval >= 7 ngày
```

Cả hai điều kiện phải đúng cùng lúc. Vì một lần Sai reset `repetitions = 0` và
`interval = 1`, trả lời sai làm **% tụt xuống** ngay lập tức. Deck rỗng → 0%
(không phải `NaN`).

Progress bar hiện ở đầu cả `/study` và `/stats`.

## Trang quản lý & nhập nhanh

`/manage`:

- Thêm / sửa / xoá **nhóm âm** (loại + ghi chú), lọc theo nguyên âm / phụ âm.
- Thêm / sửa / xoá **cách viết** trong nhóm. Mỗi dòng hiện luôn `đúng N · sai N ·
  ôn lại YYYY-MM-DD` và nhãn `thuộc` nếu đã đạt.
- Thêm / xoá **từ ví dụ** (chip có dấu ×).
- **Export JSON** / **Import JSON** / **Nạp lại data mẫu**.
- Sửa gì là lưu ngay vào localStorage, không có nút Save.

Xoá cả nhóm cần bấm xác nhận; xoá cách viết thì không (xoá là mất luôn tiến độ ôn
của cách viết đó).

### Nhập nhanh

Mỗi dòng một nhóm âm:

```
vowel | a ngắn (cat) | a: cat, hat | ai: plaid
consonant | âm f (fan) | f: fan | ph: phone, graph
```

Cú pháp `type | ghi chú | cách-viết: ví dụ, ví dụ | cách-viết: ...`

- Cột 1: `vowel` / `consonant` (viết `v`/`n` → nguyên âm, `c`/`p` → phụ âm cũng được).
- Cột 2: ghi chú, cũng là **khoá gộp**.
- Từ cột 3: mỗi cột một cách viết, ví dụ nằm sau dấu `:`, cách nhau bằng dấu phẩy.
  Cách viết không có ví dụ thì ghi tên trơn cũng được.
- Dòng trống và dòng bắt đầu bằng `#` bị bỏ qua. Lỗi từng dòng hiện ngay bên dưới.

**Quy tắc gộp:**

- Ghi chú **trùng** (không phân biệt hoa thường) → gộp vào nhóm cũ: thêm cách viết
  mới, hợp nhất danh sách ví dụ. **Không ghi đè, không mất tiến độ ôn.**
- Ghi chú **để trống** (`vowel |  | a: cat`) → luôn tạo nhóm mới.
- Cách viết trùng trong cùng nhóm → chỉ thêm những ví dụ chưa có.

## Trang thống kê

`/stats`: progress bar, 4 ô số (cần ôn hôm nay / tổng cách viết / đã thuộc / %),
và **top 5 cách viết sai nhiều nhất** vẽ bằng div (không dùng thư viện chart).
"Cần ôn hôm nay" tính cả thẻ mới chưa học.

## Backup dữ liệu

- **Export**: `/manage` → **Export JSON** → tải `phonics-backup-YYYY-MM-DD.json`
  (gồm cả tiến độ ôn tập).
- **Import**: `/manage` → **Import JSON**. Lưu ý: import **ghi đè toàn bộ** dữ liệu
  hiện tại — nó là restore backup. Muốn *thêm* âm mới thì dùng **Nhập nhanh**.
- Dữ liệu ở localStorage key `phonics-flashcard:v1`, dạng `{ version, data }`.
  Xoá site data của trình duyệt = mất sạch, nên export định kỳ.
- Backup `version: 1` (bản còn trường `ipa`) vẫn import được: `storage.ts` tự bỏ
  `ipa`, giữ nguyên ghi chú / cách viết / tiến độ.
- Mang sang máy khác: Export ở máy A → Import ở máy B.

## Dark mode

Toggle 🌙/☀️ ở header, lưu ở localStorage key `phonics-flashcard:theme`. Lần đầu
theo `prefers-color-scheme` của hệ thống.

Không bị flash vì class `dark` được set bằng một `<script>` inline trong
`index.html`, **trước khi React mount**; `useDarkMode` đọc lại class đó làm state
ban đầu thay vì tự đoán.

## Deploy Netlify

**Cách 1 — kéo thả (nhanh nhất):**

```bash
npm run build
```

Mở [app.netlify.com/drop](https://app.netlify.com/drop) rồi kéo thẳng thư mục
`dist/` vào. (`dist/_redirects` được copy từ `public/` nên refresh ở `/manage`
không bị 404.)

**Cách 2 — connect Git repo (tự deploy mỗi lần push):**

1. Push repo này lên GitHub.
2. Netlify → **Add new site** → **Import an existing project** → chọn repo.
3. Build settings để mặc định — `netlify.toml` đã khai báo sẵn: build command
   `npm run build`, publish `dist`, Node 20, SPA redirect.
4. **Deploy**. Mỗi lần push vào `main` là Netlify build lại.

Không cần env var, không cần plugin.

## Cấu trúc code

```
src/
├── components/
│   ├── TypingCard.tsx      2 phase (spell / reveal) + ô nhập có flash đỏ khi sai
│   ├── ProgressBar.tsx
│   ├── ThemeToggle.tsx
│   ├── PhonemeManager.tsx  CRUD nhóm âm / cách viết / ví dụ
│   └── BulkImport.tsx      parseBulk + textarea nhập nhanh
├── hooks/
│   ├── useStore.ts         context + localStorage, mọi hành động sửa dữ liệu
│   ├── useStudyQueue.ts    state của một phiên học, tự chấm điểm
│   └── useDarkMode.ts
├── lib/
│   ├── sm2.ts              date helper, review(), gradeFromTyping(), queue, stats
│   ├── sm2.test.ts         30 test
│   ├── storage.ts          load/save/migrate/export/import
│   ├── storage.test.ts     5 test
│   ├── seed.ts             data mẫu
│   └── types.ts
└── pages/                  StudyPage, ManagePage, StatsPage
```

Stack: Vite + React 18 + TypeScript + Tailwind v3 (`darkMode: 'class'`) +
react-router-dom. Không state management library, không thư viện chart, không
backend. Test bằng vitest, chỉ test phần logic thuần.

## Muốn đổi hành vi thì sửa ở đâu

| Muốn đổi | Sửa ở |
| --- | --- |
| Định nghĩa "thuộc" (3 lần / 7 ngày) | `isLearned` trong `sm2.ts` |
| Công thức ease / interval | `review` trong `sm2.ts` |
| Điểm chấm từ kết quả gõ | `gradeFromTyping` trong `sm2.ts` |
| Ngưỡng lặp lại trong phiên (`grade < 4`) | `commit` trong `useStudyQueue.ts` |
| Cửa sổ "due sắp tới" (1–3 ngày) | `buildQueue` trong `sm2.ts` |
| Độ chặt của so khớp | `normalize` trong `sm2.ts` |
| Data mẫu | `seed.ts` |

Hai ngưỡng dễ lẫn nhau, cố ý để rời nhau:

- `grade >= 3` = **đạt** theo SM-2 → được tăng interval.
- `grade < 4` = **phải gặp lại trong phiên này**. Nên `Khó` (3) vừa được tăng
  interval, vừa quay lại cuối phiên.
