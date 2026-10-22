# Phonics Flashcard

App học phonics tiếng Anh: cho một âm, gõ lại tất cả trường hợp (cách viết) tạo
nên âm đó và ví dụ cho từng trường hợp — hoặc ngược lại, cho một cách viết, gõ
lại các âm nó tạo ra. Chấm điểm tự động, lịch ôn theo spaced repetition (SM-2),
kèm trang tra cứu chữ ↔ âm. Dữ liệu lưu trong localStorage của trình duyệt —
không backend, không login, không đồng bộ.

- [Setup](#setup)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Cách học](#cách-học)
- [Học chiều Chữ → Âm](#học-chiều-chữ--âm)
- [Cách tính điểm](#cách-tính-điểm)
- [Thuật toán SM-2 & lịch ôn](#thuật-toán-sm-2--lịch-ôn)
- [Thứ tự thẻ trong phiên](#thứ-tự-thẻ-trong-phiên)
- [Progress % và định nghĩa "thuộc"](#progress--và-định-nghĩa-thuộc)
- [Trang tra cứu](#trang-tra-cứu)
- [Trang quản lý & nhập nhanh](#trang-quản-lý--nhập-nhanh)
- [Trang thống kê](#trang-thống-kê)
- [Backup dữ liệu](#backup-dữ-liệu)
- [Giao diện](#giao-diện)
- [Deploy Netlify](#deploy-netlify)
- [Cấu trúc code](#cấu-trúc-code)
- [Muốn đổi hành vi thì sửa ở đâu](#muốn-đổi-hành-vi-thì-sửa-ở-đâu)

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

Lần đầu mở app đã có sẵn bộ âm đầy đủ: **21 nguyên âm + 29 phụ âm = 50 âm, 221
trường hợp, 1214 từ ví dụ**. Mọi thứ đều sửa được ở `/manage` — nhãn âm là text tự do.

Data mặc định lấy từ đâu (`seedData()` trong `src/lib/seed.ts`):

1. Có file `phonics-backup-2026-10-21.json` ở gốc repo → lấy bộ âm trong file đó
   (bỏ hết tiến độ ôn). File này bị gitignore (`phonics-backup-*.json`), chỉ có ở
   máy đã để nó vào.
2. Không có file (vd Netlify build từ git) → dùng mảng `SEED` soạn sẵn trong
   `seed.ts`, nằm trong git nên mở máy mới là có ngay.

Hai nguồn đang giống nhau. Sửa bộ âm mặc định thì sửa `SEED` để bản deploy cũng
có data mới.

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit test cho sm2, deck, lookup, storage, seed (102 test)
npm run test:watch  # vitest watch mode
npm run build       # typecheck + build ra dist/
npm run preview     # xem thử bản build
```

## Mô hình dữ liệu

Ba tầng lồng nhau, lưu thành **một** key trong localStorage.

```
Phoneme  (một âm)              id, type: 'vowel'|'consonant', note?
└── Grapheme (trường hợp)      id, spelling, examples: string[]
    ├── review: ReviewState    lastReviewed, interval, easeFactor, repetitions,
    │                          nextDue, correctCount, wrongCount
    └── reverseReview?         ReviewState của chiều Chữ → Âm (chưa học thì không có)
```

Bốn điều cần nhớ:

1. **Không có trường IPA riêng.** Nhãn của âm nằm ở `note` — một field text tự do,
   trong UI hiện là **"Âm"** (`placeholder: /æ/`). Data mẫu điền IPA vào đây, nhưng
   ghi gì cũng được.
2. **`note` chính là đề bài khi học.** Nó tuỳ chọn về mặt kiểu dữ liệu, nhưng âm
   không có nhãn thì lúc học chỉ hiện *"(nhóm chưa có nhãn)"* — không có gì để đoán.
   Nên luôn đặt nhãn.
3. **Tiến độ ôn gắn vào từng trường hợp, không gắn vào âm.** Âm chỉ là đơn vị khi
   học; một lượt học ghi điểm cho *mọi* trường hợp thuộc âm đó.
4. **Hai chiều học có hai lịch ôn riêng.** `review` là chiều Âm → Chữ,
   `reverseReview` là chiều Chữ → Âm. Field sau không bắt buộc nên data cũ không
   cần migrate; thiếu thì coi như thẻ mới.

Ngày tháng lưu dạng chuỗi `"YYYY-MM-DD"` (không có giờ, không timezone).

## Cách học

Trang `/study`. Đầu trang có nút chọn chiều học **Âm → Chữ** / **Chữ → Âm**; app
nhớ chiều đã chọn cho lần sau. Phần dưới đây tả chiều Âm → Chữ (mặc định), chiều
kia xem [Học chiều Chữ → Âm](#học-chiều-chữ--âm).

Đơn vị học là **một âm**, không phải một trường hợp lẻ. Luồng gõ **xen kẽ**: đúng
một trường hợp là hỏi ví dụ cho đúng trường hợp đó ngay.

**Bước 1 — hỏi âm**

Đề bài là nhãn của âm (vd `/æ/`) + loại (nguyên âm / phụ âm) + số trường hợp cần
tìm, kèm câu hỏi *"Những trường hợp nào tạo nên âm này?"*.

Nút **👁 hiện số trường hợp / 🙈 ẩn số trường hợp** bật tắt phần "· N trường hợp"
trên đề và mẫu số của bộ đếm (`đã đúng 2` thay vì `đã đúng 2/4`) — để luyện nâng
cao, không dựa vào số. Mặc định hiện.

**Bước 2 — gõ một trường hợp**

Gõ một trường hợp rồi **Enter**:

- **Đúng** → chip xanh `✓ a`, và app **chuyển ngay sang hỏi ví dụ cho `a`** (bước 3).
- **Sai** → chip đỏ gạch ngang, **bỏ qua bước ví dụ**, quay lại gõ trường hợp khác.
  Gõ sai *không* bị trừ điểm (nó không ứng với trường hợp nào trong dữ liệu), chỉ
  để bạn thấy mình đã thử gì.
- **Gõ lại cái đã đúng** → bỏ qua, không tính thêm, không hỏi lại ví dụ.
- Trường hợp đúng nhưng **chưa có ví dụ nào trong dữ liệu** → không hỏi ví dụ, quay
  lại gõ trường hợp luôn.

Bộ đếm `đã đúng 2/4` cho biết còn thiếu bao nhiêu; có trường hợp còn nợ ví dụ
thì thêm `· nợ 1 ví dụ`.

**Bước 3 — gõ một ví dụ cho trường hợp vừa đúng**

Câu hỏi đổi thành *"Đúng rồi. Cho **một** ví dụ dùng **a** đọc thành âm này"*.

**Chỉ cần một ví dụ đúng là xong** — gõ được là tự quay lại bước 2 ngay. Danh sách
ví dụ trong dữ liệu không phải bài tập phải làm hết, nó là *tập đáp án được chấp
nhận*: seed 6 từ nghĩa là bạn nhớ ra từ nào trong 6 từ đó cũng tính đúng. Dòng
`6 đáp án được chấp nhận` dưới ô nhập chính là số đó.

Chưa nghĩ ra từ nào thì **Enter khi ô trống** hoặc bấm **Chưa nghĩ ra, để sau →**.
Bỏ qua chỉ là *để sau*, không mất cơ hội: trường hợp đó thành **nợ ví dụ**, trong
danh sách đã đúng nó có nút **+ ví dụ** — bấm vào là quay lại gõ ví dụ cho nó, lúc
nào cũng được cho tới khi xem đáp án. Tới lúc chấm mà vẫn chưa gõ được ví dụ thì
trường hợp đó bị chấm Khó (3) chứ không phải Sai.

**Bước 4 — xem đáp án**

App tự sang bảng đáp án khi đã tìm đủ tất cả trường hợp **và** không còn trường hợp
nào nợ ví dụ. Đủ trường hợp mà còn nợ thì app nhắc *"Đủ trường hợp rồi — gõ bù ví
dụ còn thiếu hoặc xem đáp án"*. Muốn dừng sớm thì bấm **Hết rồi, xem đáp án →**
hoặc Enter lúc ô trống ở bước 2. Bảng tổng kết cho từng trường hợp:

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
| `Enter` (ô trống, đang gõ ví dụ) | để sau, quay lại gõ trường hợp (còn nợ ví dụ) |

Ô nhập tự focus mỗi khi câu hỏi đổi, nên gõ liên tục không cần chuột. Không còn
phím `Space` / `1` `2` `3` `4` như bản thẻ lật cũ — điểm giờ tự chấm.

## Học chiều Chữ → Âm

Chọn **Chữ → Âm** ở đầu trang `/study`. Đề bài là **một cách viết** (vd `ea`), câu
hỏi *"Cách viết này tạo ra những âm nào?"*; gõ từng âm, đúng thì gõ một ví dụ có
cách viết đó đọc thành âm vừa gõ. Luồng gõ xen kẽ, nợ ví dụ, bảng đáp án và cách
chấm giống hệt chiều Âm → Chữ — hai chiều dùng chung `useStudyQueue` và
`TypingCard`, khác nhau ở bộ thẻ dựng trong `src/lib/deck.ts`.

Bộ thẻ chiều ngược (`reverseDeck`):

- Mỗi cách viết là một thẻ. Chú thích trong ngoặc bị bỏ khi gộp: `wr (w câm)` và
  `wr` là cùng thẻ `wr`.
- Đáp án là các âm có cách viết đó. Hai trường hợp cùng cách viết trong một âm
  (vd `ce` và `ce (…)`) gộp thành một đáp án: ví dụ gộp lại, chấm vào cả hai.
- Âm chưa có nhãn bị bỏ qua — không có gì để gõ.

Gõ tên âm **không cần dấu `/`**, không phân biệt hoa thường, bỏ khoảng trắng:
`ai` = `/ai/`, `short oo` = `Short /oo/`. Gõ tắt phần giữa hai dấu `/` (`oo`) chỉ
được nhận khi trong thẻ chỉ có **một** âm như vậy, để không ăn cả Short lẫn Long.

Chuyển chiều là bắt đầu một phiên mới, không trộn hai bộ thẻ. Điểm ghi vào
`reverseReview` của từng trường hợp, nên học chiều này không ảnh hưởng lịch ôn
chiều kia.

## Cách tính điểm

Không có nút tự đánh giá. Điểm suy ra từ những gì bạn gõ, tính **riêng cho từng
trường hợp** trong âm đó:

| Kết quả gõ | Điểm | Nhãn |
| --- | --- | --- |
| Đúng trường hợp **+ 1 từ ví dụ** (bất kỳ từ nào trong danh sách) | 4 | Tốt |
| Đúng trường hợp, **không nhớ được ví dụ nào** (bỏ qua mà không gõ bù, hoặc gõ sai) | 3 | Khó |
| **Thiếu** trường hợp (không gõ ra) | 1 | Sai |
| Đúng trường hợp, mà trường hợp đó **chưa có ví dụ nào trong dữ liệu** | 4 | Tốt |

Dòng cuối là chủ ý: không thể trừ điểm vì thiếu dữ liệu mà chính bạn chưa nhập.

Hàm quyết định là `gradeFromTyping` trong `src/lib/sm2.ts` (có unit test).

### Lặp lại trong phiên

Âm nào có **ít nhất một trường hợp bị điểm dưới 4** sẽ được đẩy về **cuối queue
của phiên hiện tại**. Tức là cả `Sai` và `Khó` đều làm âm đó quay lại.

Lượt sau, cả âm được chấm lại từ đầu (kể cả những trường hợp lần trước đã đúng).
Nhưng chấm lại **trong cùng một ngày** không đẩy lịch ôn đi tiếp — xem
[chấm lại trong ngày](#chấm-lại-trong-cùng-một-ngày): lần chấm đầu tiên trong ngày
quyết định lịch, các lần đúng sau chỉ để luyện tay. Vòng lặp tự kết thúc vì ở bước
xem đáp án bạn đã thấy hết.

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
| 3 trở đi | `min(365, round(interval_cũ * new_ease))` |

Lưu ý: nhân với ease **mới**, không phải ease cũ. Trần `MAX_INTERVAL = 365` ngày
để `nextDue` không bay đi vài năm (và không tràn khỏi khoảng ngày hợp lệ).

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

### Chấm lại trong cùng một ngày

Một âm bị lặp lại trong phiên thì bị chấm nhiều lần trong một ngày. Nếu lần nào
cũng tính SM-2 như thường, mỗi vòng lại nhân interval lên: một trường hợp có thể
"thuộc" chỉ sau một buổi và `nextDue` nhảy đi vài năm. Nên khi
`lastReviewed === today`:

- **Đúng** (`grade >= 3`) → chỉ `correctCount += 1`, giữ nguyên `repetitions` /
  `interval` / `nextDue` / ease.
- **Sai** → vẫn tính lại lịch như thường (quên là quên: `repetitions = 0`,
  `interval = 1`), nhưng **ease không bị trừ thêm** — ease chỉ bị trừ một lần
  trong ngày, để luyện nhiều vòng không đẩy ease xuống sàn 1.3.

> Grade 5 không còn được phát ra khi học (chấm tự động chỉ dùng 1 / 3 / 4), nhưng
> `review()` vẫn xử lý đúng grade 5 và vẫn có test — để sau này thêm lại dễ.

## Thứ tự thẻ trong phiên

Queue được **chốt một lần khi vào phiên** (`/study`), nên chấm điểm giữa phiên
không làm xáo trộn phần còn lại.

Thứ tự ưu tiên (mỗi âm lấy mức gấp nhất trong các trường hợp của nó):

1. **Quá hạn / đến hạn hôm nay** (`nextDue <= hôm nay`) — quá hạn lâu nhất lên trước
2. **Thẻ mới** (`nextDue === null`, chưa học lần nào)
3. **Sắp đến hạn trong 1–3 ngày** — gần hạn hơn lên trước
4. Đến hạn xa hơn 3 ngày: **không đưa vào phiên**

Trường hợp **đã chấm hôm nay** (`lastReviewed === hôm nay`) không được tính khi
xếp mức ưu tiên, nên âm đã học xong hôm nay không quay lại hàng đợi — kể cả khi
reload trang, vì nó suy ra từ dữ liệu chứ không từ state của phiên. Cờ này là
`skipDoneToday` (mặc định bật).

**Cùng một mức ưu tiên thì thứ tự ngẫu nhiên, đổi mỗi phiên.** Cách làm: xáo
Fisher-Yates trước rồi mới `sort` theo số ngày — `Array.sort` ổn định (ES2019) nên
"quá hạn lâu nhất lên trước" vẫn đúng tuyệt đối, chỉ những âm *bằng nhau về số
ngày* mới hoán đổi. Lúc bộ âm còn mới tinh thì cả 50 âm cùng mức "thẻ mới", nên
thứ tự hoàn toàn ngẫu nhiên chứ không chạy tuần tự từ `/a/` xuống.

Logic xếp hàng nằm ở `buildReviewQueue` trong `sm2.ts`, dùng chung cho cả hai
chiều: chiều Âm → Chữ gọi qua `buildGroupQueue` (mỗi âm là một nhóm), chiều
Chữ → Âm gọi qua `buildDeckQueue` trong `deck.ts` (mỗi cách viết là một nhóm).

Nguồn ngẫu nhiên truyền vào qua tham số `rng` (mặc định `Math.random`) nên test
vẫn deterministic — xem `describe('shuffling within a priority level')`.

Học hết queue → hiện *"Hết thẻ cần ôn hôm nay"* + nút **Luyện tự do (không tính
tiến độ)**: dựng lại queue với `skipDoneToday: false`, hỏi cả những âm đã chấm hôm
nay. Vì chấm lại trong ngày không đẩy lịch, đây là luyện tay — tiến độ không tăng.

## Progress % và định nghĩa "thuộc"

```
% = (số trường hợp đã "thuộc") / (tổng số trường hợp) * 100     // làm tròn
"thuộc" = repetitions >= 3  VÀ  interval >= 7 ngày
```

Cả hai điều kiện phải đúng cùng lúc. Vì một lần Sai reset `repetitions = 0` và
`interval = 1`, trả lời sai làm **% tụt xuống** ngay lập tức. Deck rỗng → 0%
(không phải `NaN`).

Chiều Chữ → Âm tính riêng, đơn vị là **cặp chữ – âm** (một đáp án của thẻ, xem
`deckProgress` trong `deck.ts`). Đáp án gộp từ nhiều trường hợp chỉ "thuộc" khi
*mọi* trường hợp của nó đều thuộc.

Progress bar hiện ở đầu `/study` (theo chiều đang học) và ở `/stats` (cả hai chiều).

## Trang tra cứu

`/lookup`, hai tab bấm qua lại:

- **Chữ → Âm**: gõ một chữ / cặp chữ (`y`, `igh`, `x`, `a-e` — `a_e` cũng được) ra
  mọi âm nó tạo ra, chia nhóm **Nguyên âm** / **Phụ âm**, kèm ví dụ có **tô đậm
  phần chữ tạo ra âm** (cách viết tách đôi như `a-e` thì tô hai nửa: `face` tô `a`
  và `e`). Ô nhập có gợi ý mọi cách viết trong data. Bên dưới có mục gập **Cách
  viết khác có chứa "…"** — các cách viết dài hơn có chứa chữ đang tra (tra `igh`
  ra cả `eigh`, `aigh`), có thể đọc khác hẳn; icon ⓘ giải thích khi hover, bấm một
  cách viết trong đó để tra nó.
- **Âm → Chữ**: gõ tên âm không cần dấu `/` (`ai`, `short oo`) ra mọi cách viết của
  âm đó. Gõ `oo` ra cả Short /oo/ lẫn Long /oo/; âm có tên *chứa* chữ tra (tra `ai`
  ra thêm `/air/`) nằm ở mục riêng.

Hai tab nối nhau: bấm tên âm trong kết quả Chữ → Âm là nhảy sang Âm → Chữ của âm
đó, bấm một cách viết trong kết quả Âm → Chữ là nhảy sang Chữ → Âm. Trạng thái nằm trên URL (`?mode=sound&q=ai`) nên
nút Back của trình duyệt quay lại được và link chia sẻ được; đang gõ thì URL thay
tại chỗ, không đẻ một bước lịch sử cho mỗi phím.

So khớp tra cứu không phân biệt hoa thường, bỏ khoảng trắng, bỏ chú thích trong
ngoặc của trường hợp (`wr (w câm)` tra bằng `wr`). Logic ở `src/lib/lookup.ts`.

## Trang quản lý & nhập nhanh

`/manage`:

- Thêm / sửa / xoá **âm** (loại + nhãn ở field **Âm**), lọc theo nguyên âm / phụ âm.
- Thêm / sửa / xoá **trường hợp** trong âm. Mỗi dòng hiện luôn `đúng N · sai N ·
  ôn lại YYYY-MM-DD` và nhãn `thuộc` nếu đã đạt.
- Thêm / xoá **từ ví dụ** (chip có dấu ×). **Bấm vào từ ví dụ để sửa tại chỗ**:
  Enter hoặc bấm ra ngoài để lưu, Esc để huỷ, từ giữ nguyên vị trí trong danh
  sách. Sửa thành rỗng, không đổi, hoặc trùng ví dụ khác cùng trường hợp thì bỏ qua.
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

`/stats`: hai progress bar (**Âm → Chữ** theo trường hợp, **Chữ → Âm** theo cặp
chữ – âm), 4 ô số (cần ôn hôm nay / tổng trường hợp / đã thuộc / %), và **top 5
trường hợp sai nhiều nhất** vẽ bằng div (không dùng thư viện chart). "Cần ôn hôm
nay" tính cả thẻ mới chưa học. 4 ô số và top 5 chỉ tính chiều Âm → Chữ.

## Backup dữ liệu

- **Export**: `/manage` → **Export JSON** → tải `phonics-backup-YYYY-MM-DD.json`
  (gồm cả tiến độ ôn tập).
- **Import**: `/manage` → **Import JSON**. Lưu ý: import **ghi đè toàn bộ** dữ liệu
  hiện tại — nó là restore backup. Muốn *thêm* âm mới thì dùng **Nhập nhanh**.
- Dữ liệu ở localStorage key `phonics-flashcard:v2`, dạng `{ version, data }`.
  Xoá site data của trình duyệt = mất sạch, nên export định kỳ.
- Tuỳ chọn luyện tập (chiều học đang chọn, ẩn/hiện số trường hợp) nằm riêng ở key
  `phonics-flashcard:settings`, không nằm trong backup.
- Backup `version: 1` (bản còn trường `ipa`) vẫn import được: `storage.ts` tự bỏ
  `ipa`, giữ nguyên nhãn / trường hợp / tiến độ.
- Đổi `STORAGE_KEY` (v1 → v2) là cách chủ động vứt hết dữ liệu cũ và nạp lại seed;
  key cũ được xoá luôn lúc load. Chỉ làm khi bộ âm thay đổi tận gốc.
- Mang sang máy khác: Export ở máy A → Import ở máy B.

## Giao diện

Phong cách Cyberpunk, chỉ có nền tối: class `dark` luôn bật sẵn trên `<html>`.
Bảng màu nằm ở `tailwind.config.ts`: năm dải `slate` / `sky` / `emerald` / `rose` /
`amber` được định nghĩa lại thành màu neon nhưng giữ tên, nên component không phải
đổi class. Khung HUD, nút, chữ neon và hiệu ứng (glitch khi sang thẻ, rung khi gõ
sai, thanh tiến độ sọc) ở `src/index.css`. Hiệu ứng tự tắt khi hệ thống bật
`prefers-reduced-motion`.

Font Chakra Petch (chữ thường) và JetBrains Mono (ô gõ) lấy từ Google Fonts, đều có
tiếng Việt; mất mạng thì rơi về font hệ thống.

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
│   ├── TypingCard.tsx      phase answer (gõ xen kẽ, nợ ví dụ) / summary, dùng cho cả hai chiều
│   ├── ProgressBar.tsx
│   ├── PhonemeManager.tsx  CRUD âm / trường hợp / ví dụ (sửa ví dụ tại chỗ)
│   └── BulkImport.tsx      parseBulk + textarea nhập nhanh
├── hooks/
│   ├── useStore.ts         context + localStorage, mọi hành động sửa dữ liệu
│   ├── useStudyQueue.ts    state machine của phiên học (answer/summary), tự chấm
│   └── useSettings.ts      tuỳ chọn luyện tập (chiều học, ẩn số trường hợp)
├── lib/
│   ├── sm2.ts              date helper, review(), gradeFromTyping(), queue, stats
│   ├── sm2.test.ts         44 test
│   ├── deck.ts             bộ thẻ hai chiều: forwardDeck / reverseDeck, matchAnswer, progress
│   ├── deck.test.ts        14 test
│   ├── lookup.ts           tra cứu chữ ↔ âm, tô phần chữ trong ví dụ
│   ├── lookup.test.ts      22 test
│   ├── storage.ts          load/save/migrate/export/import
│   ├── storage.test.ts     5 test
│   ├── seed.ts             bộ âm mặc định (50 âm), seedData()
│   ├── seed.test.ts        17 test, kiểm tra bộ âm không có nhãn/trường hợp trùng
│   └── types.ts
└── pages/                  StudyPage, LookupPage, ManagePage, StatsPage
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
| Luồng hỏi xen kẽ (đúng → hỏi ví dụ ngay) | `submitAnswer` / `submitExample` trong `useStudyQueue.ts` |
| Điều kiện sang màn đáp án (đủ trường hợp + hết nợ ví dụ) | `isGroupDone` trong `useStudyQueue.ts` |
| Chấm lại trong ngày / trần interval | `review` và `MAX_INTERVAL` trong `sm2.ts` |
| Cửa sổ "due sắp tới" (1–3 ngày), bỏ thẻ đã chấm hôm nay | `buildReviewQueue` trong `sm2.ts` |
| Xáo ngẫu nhiên / bỏ xáo | `shuffled()` trong `buildReviewQueue`, `sm2.ts` |
| Độ chặt của so khớp | `normalize` trong `sm2.ts` (chiều xuôi), `soundKey` / `soundCore` trong `lookup.ts` (gõ tên âm) |
| Cách gộp thẻ chiều Chữ → Âm | `reverseDeck` trong `deck.ts` |
| Tra cứu, tô chữ trong ví dụ | `lookupSpelling` / `lookupSound` / `highlightExample` trong `lookup.ts` |
| Bộ âm mặc định | `SEED` trong `seed.ts` (sửa xong chạy `npm test` để bắt trùng lặp) |

Hai ngưỡng dễ lẫn nhau, cố ý để rời nhau:

- `grade >= 3` = **đạt** theo SM-2 → được tăng interval.
- `grade < 4` = **phải gặp lại trong phiên này**. Nên `Khó` (3) vừa được tăng
  interval, vừa quay lại cuối phiên.
