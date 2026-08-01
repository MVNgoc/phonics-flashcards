# Phonics Flashcard

App học phonics tiếng Anh: cho một âm, gõ lại tất cả trường hợp (cách viết) tạo
nên âm đó và ví dụ cho từng trường hợp; chấm điểm tự động,
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

Lần đầu mở app đã có sẵn bộ âm đầy đủ: **21 nguyên âm + 11 phụ âm = 32 âm, 149
trường hợp, 837 từ ví dụ**, nằm trong `src/lib/seed.ts` (nên nó ở trong git, mở
máy mới là có ngay). Mọi thứ đều sửa được ở `/manage` — nhãn âm là text tự do.

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit test cho sm2.ts, storage.ts, seed.ts (43 test)
npm run test:watch  # vitest watch mode
npm run build       # typecheck + build ra dist/
npm run preview     # xem thử bản build
```

## Mô hình dữ liệu

Ba tầng lồng nhau, lưu thành **một** key trong localStorage.

```
Phoneme  (một âm)              id, type: 'vowel'|'consonant', note?
└── Grapheme (trường hợp)      id, spelling, examples: string[]
    └── ReviewState            lastReviewed, interval, easeFactor, repetitions,
                               nextDue, correctCount, wrongCount
```

Ba điều cần nhớ:

1. **Không có trường IPA riêng.** Nhãn của âm nằm ở `note` — một field text tự do,
   trong UI hiện là **"Âm"** (`placeholder: /æ/`). Data mẫu điền IPA vào đây, nhưng
   ghi gì cũng được.
2. **`note` chính là đề bài khi học.** Nó tuỳ chọn về mặt kiểu dữ liệu, nhưng âm
   không có nhãn thì lúc học chỉ hiện *"(nhóm chưa có nhãn)"* — không có gì để đoán.
   Nên luôn đặt nhãn.
3. **Tiến độ ôn gắn vào từng trường hợp, không gắn vào âm.** Âm chỉ là đơn vị khi
   học; một lượt học ghi điểm cho *mọi* trường hợp thuộc âm đó.

Ngày tháng lưu dạng chuỗi `"YYYY-MM-DD"` (không có giờ, không timezone).

## Cách học

Trang `/study`. Đơn vị học là **một âm**, không phải một trường hợp lẻ. Luồng gõ
**xen kẽ**: đúng một trường hợp là hỏi ví dụ cho đúng trường hợp đó ngay.

**Bước 1 — hỏi âm**

Đề bài là nhãn của âm (vd `/æ/`) + loại (nguyên âm / phụ âm) + số trường hợp cần
tìm, kèm câu hỏi *"Những trường hợp nào tạo nên âm này?"*.

**Bước 2 — gõ một trường hợp**

Gõ một trường hợp rồi **Enter**:

- **Đúng** → chip xanh `✓ a`, và app **chuyển ngay sang hỏi ví dụ cho `a`** (bước 3).
- **Sai** → chip đỏ gạch ngang, **bỏ qua bước ví dụ**, quay lại gõ trường hợp khác.
  Gõ sai *không* bị trừ điểm (nó không ứng với trường hợp nào trong dữ liệu), chỉ
  để bạn thấy mình đã thử gì.
- **Gõ lại cái đã đúng** → bỏ qua, không tính thêm, không hỏi lại ví dụ.
- Trường hợp đúng nhưng **chưa có ví dụ nào trong dữ liệu** → không hỏi ví dụ, quay
  lại gõ trường hợp luôn.

Bộ đếm `đã đúng 2/4` cho biết còn thiếu bao nhiêu.

**Bước 3 — gõ ví dụ cho trường hợp vừa đúng**

Câu hỏi đổi thành *"Đúng rồi. Cho ví dụ dùng **a** đọc thành âm này"*. Gõ từng từ
rồi Enter; đúng thì từ đó hiện cạnh chip trường hợp, số `còn N ví dụ` giảm dần.

Thoát bước này bằng một trong ba cách:

- gõ đủ **hết** ví dụ của trường hợp đó → tự động quay lại bước 2
- **Enter khi ô trống** → bỏ qua phần ví dụ còn lại
- bấm **Bỏ qua ví dụ →**

**Bước 4 — xem đáp án**

Khi đã tìm đủ tất cả trường hợp (hoặc bạn bấm **Hết rồi, xem đáp án →** / Enter
lúc ô trống ở bước 2), app hiện bảng tổng kết cho từng trường hợp:

- ✓ xanh = gõ được, ✗ đỏ = thiếu, kèm nhãn điểm `Tốt` / `Khó` / `Sai`
- toàn bộ ví dụ của trường hợp đó: **xanh** = bạn đã gõ được, **xám** = chưa gõ được
  (kể cả những trường hợp bạn gõ thiếu — để học luôn)

**Bước 5 — chấm**

Bấm **Chấm & thẻ tiếp**: ghi điểm cho *mọi* trường hợp trong âm đó, cập nhật lịch
ôn, sang âm tiếp theo.

### Quy tắc so khớp

- Không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối: gõ `  CAT ` khớp `cat`.
- Ngoài hai điều trên là **so khớp tuyệt đối** — sai một chữ là không khớp, không
  có fuzzy match, không bỏ qua dấu.

### Bàn phím

| Phím | Tác dụng |
| --- | --- |
| `Enter` (ô có chữ) | gửi câu trả lời |
| `Enter` (ô trống, đang gõ trường hợp) | ngừng và xem đáp án |
| `Enter` (ô trống, đang gõ ví dụ) | bỏ qua phần ví dụ còn lại |

Ô nhập tự focus mỗi khi câu hỏi đổi, nên gõ liên tục không cần chuột. Không còn
phím `Space` / `1` `2` `3` `4` như bản thẻ lật cũ — điểm giờ tự chấm.

## Cách tính điểm

Không có nút tự đánh giá. Điểm suy ra từ những gì bạn gõ, tính **riêng cho từng
trường hợp** trong âm đó:

| Kết quả gõ | Điểm | Nhãn |
| --- | --- | --- |
| Đúng trường hợp **+ ít nhất 1 từ ví dụ** | 4 | Tốt |
| Đúng trường hợp, **không gõ được ví dụ nào** (bỏ qua hoặc gõ sai hết) | 3 | Khó |
| **Thiếu** trường hợp (không gõ ra) | 1 | Sai |
| Đúng trường hợp, mà trường hợp đó **chưa có ví dụ nào trong dữ liệu** | 4 | Tốt |

Dòng cuối là chủ ý: không thể trừ điểm vì thiếu dữ liệu mà chính bạn chưa nhập.

Hàm quyết định là `gradeFromTyping` trong `src/lib/sm2.ts` (có unit test).

### Lặp lại trong phiên

Âm nào có **ít nhất một trường hợp bị điểm dưới 4** sẽ được đẩy về **cuối queue
của phiên hiện tại**. Tức là cả `Sai` và `Khó` đều làm âm đó quay lại.

Lượt sau, cả âm được chấm lại từ đầu (kể cả những trường hợp lần trước đã đúng),
và **lần trả lời cuối cùng là lần quyết định lịch ôn**. Vòng lặp tự kết thúc vì ở
bước xem đáp án bạn đã thấy hết.

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

Thứ tự ưu tiên, xét theo từng trường hợp:

1. **Quá hạn / đến hạn hôm nay** (`nextDue <= hôm nay`) — quá hạn lâu nhất lên trước
2. **Thẻ mới** (`nextDue === null`, chưa học lần nào)
3. **Sắp đến hạn trong 1–3 ngày** — gần hạn hơn lên trước
4. Đến hạn xa hơn 3 ngày: **không đưa vào phiên**

Âm thì thừa hưởng ưu tiên của trường hợp gấp nhất trong nó
(`buildGroupQueue` chỉ dedupe `buildQueue` theo nhóm nên thứ tự khớp nhau).

Học hết queue → hiện *"Hết thẻ cần ôn hôm nay"* + nút **Học lại phiên mới** (dựng
lại queue, không đợi đến mai).

## Progress % và định nghĩa "thuộc"

```
% = (số trường hợp đã "thuộc") / (tổng số trường hợp) * 100     // làm tròn
"thuộc" = repetitions >= 3  VÀ  interval >= 7 ngày
```

Cả hai điều kiện phải đúng cùng lúc. Vì một lần Sai reset `repetitions = 0` và
`interval = 1`, trả lời sai làm **% tụt xuống** ngay lập tức. Deck rỗng → 0%
(không phải `NaN`).

Progress bar hiện ở đầu cả `/study` và `/stats`.

## Trang quản lý & nhập nhanh

`/manage`:

- Thêm / sửa / xoá **âm** (loại + nhãn ở field **Âm**), lọc theo nguyên âm / phụ âm.
- Thêm / sửa / xoá **trường hợp** trong âm. Mỗi dòng hiện luôn `đúng N · sai N ·
  ôn lại YYYY-MM-DD` và nhãn `thuộc` nếu đã đạt.
- Thêm / xoá **từ ví dụ** (chip có dấu ×).
- **Export JSON** / **Import JSON** / **Nạp lại data mẫu**.
- Sửa gì là lưu ngay vào localStorage, không có nút Save.

Xoá cả âm cần bấm xác nhận; xoá trường hợp thì không (xoá là mất luôn tiến độ ôn
của trường hợp đó).

### Nhập nhanh

Mỗi dòng một âm:

```
vowel | /æ/ | a: cat, hat | ai: plaid
consonant | /f/ | f: fan | ph: phone, graph
```

Cú pháp `type | âm | trường-hợp: ví dụ, ví dụ | trường-hợp: ...`

- Cột 1: `vowel` / `consonant` (viết `v`/`n` → nguyên âm, `c`/`p` → phụ âm cũng được).
- Cột 2: nhãn của âm, cũng là **khoá gộp**.
- Từ cột 3: mỗi cột một trường hợp, ví dụ nằm sau dấu `:`, cách nhau bằng dấu phẩy.
  Trường hợp không có ví dụ thì ghi tên trơn cũng được.
- Dòng trống và dòng bắt đầu bằng `#` bị bỏ qua. Lỗi từng dòng hiện ngay bên dưới.

**Quy tắc gộp:**

- Nhãn âm **trùng** (không phân biệt hoa thường) → gộp vào âm cũ: thêm trường hợp
  mới, hợp nhất danh sách ví dụ. **Không ghi đè, không mất tiến độ ôn.**
- Nhãn **để trống** (`vowel |  | a: cat`) → luôn tạo âm mới.
- Trường hợp trùng trong cùng một âm → chỉ thêm những ví dụ chưa có.

## Trang thống kê

`/stats`: progress bar, 4 ô số (cần ôn hôm nay / tổng trường hợp / đã thuộc / %),
và **top 5 trường hợp sai nhiều nhất** vẽ bằng div (không dùng thư viện chart).
"Cần ôn hôm nay" tính cả thẻ mới chưa học.

## Backup dữ liệu

- **Export**: `/manage` → **Export JSON** → tải `phonics-backup-YYYY-MM-DD.json`
  (gồm cả tiến độ ôn tập).
- **Import**: `/manage` → **Import JSON**. Lưu ý: import **ghi đè toàn bộ** dữ liệu
  hiện tại — nó là restore backup. Muốn *thêm* âm mới thì dùng **Nhập nhanh**.
- Dữ liệu ở localStorage key `phonics-flashcard:v2`, dạng `{ version, data }`.
  Xoá site data của trình duyệt = mất sạch, nên export định kỳ.
- Backup `version: 1` (bản còn trường `ipa`) vẫn import được: `storage.ts` tự bỏ
  `ipa`, giữ nguyên nhãn / trường hợp / tiến độ.
- Đổi `STORAGE_KEY` (v1 → v2) là cách chủ động vứt hết dữ liệu cũ và nạp lại seed;
  key cũ được xoá luôn lúc load. Chỉ làm khi bộ âm thay đổi tận gốc.
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
│   ├── TypingCard.tsx      phase answer (gõ xen kẽ) / summary + ô nhập flash đỏ
│   ├── ProgressBar.tsx
│   ├── ThemeToggle.tsx
│   ├── PhonemeManager.tsx  CRUD âm / trường hợp / ví dụ
│   └── BulkImport.tsx      parseBulk + textarea nhập nhanh
├── hooks/
│   ├── useStore.ts         context + localStorage, mọi hành động sửa dữ liệu
│   ├── useStudyQueue.ts    state machine của phiên học (answer/summary), tự chấm
│   └── useDarkMode.ts
├── lib/
│   ├── sm2.ts              date helper, review(), gradeFromTyping(), queue, stats
│   ├── sm2.test.ts         30 test
│   ├── storage.ts          load/save/migrate/export/import
│   ├── storage.test.ts     5 test
│   ├── seed.ts             bộ âm mặc định (32 âm)
│   ├── seed.test.ts        kiểm tra bộ âm không có nhãn/trường hợp trùng
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
| Luồng hỏi xen kẽ (đúng → hỏi ví dụ ngay) | `submitSpelling` / `submitExample` trong `useStudyQueue.ts` |
| Cửa sổ "due sắp tới" (1–3 ngày) | `buildQueue` trong `sm2.ts` |
| Độ chặt của so khớp | `normalize` trong `sm2.ts` |
| Bộ âm mặc định | `seed.ts` (sửa xong chạy `npm test` để bắt trùng lặp) |

Hai ngưỡng dễ lẫn nhau, cố ý để rời nhau:

- `grade >= 3` = **đạt** theo SM-2 → được tăng interval.
- `grade < 4` = **phải gặp lại trong phiên này**. Nên `Khó` (3) vừa được tăng
  interval, vừa quay lại cuối phiên.
