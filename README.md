# Mon Avenir

Lịch giảng, việc cần làm và môn học của Đỗ Thùy Hương (VLUTE · CTU) — phong cách **claymorphism ("3D đất sét")**, cùng ngôn ngữ thiết kế với [Chansonia](https://github.com/thuyhuongctu/Chansonia).

**Mở app:** <https://thuyhuongctu.github.io/Mon-avenir/> — trên điện thoại, mở bằng Chrome rồi chọn *Thêm vào màn hình chính*.

**App Android (APK):** mỗi khi code được gộp vào `main`, workflow *Build Android APK* tự build lại.
Vào tab **Actions → Build Android APK → lần chạy mới nhất**, tải `mon-avenir-apk` ở mục *Artifacts*
(cần đăng nhập GitHub), giải nén rồi cài `mon-avenir.apk` trên điện thoại.

## Tính năng

- **Hôm nay** — buổi giảng trong ngày, trạng thái tự động (sắp tới / đang dạy / xong), tick tay khi cần.
- **Tuần** — lịch tuần dạng lưới giờ, chuyển tuần trước/sau.
- **Việc** — danh sách việc cần làm theo từng ngày, gợi ý tự động (soạn bài, điểm danh…) dựa trên buổi giảng.
- **Môn** — tổng quan các môn đang dạy, số buổi còn lại, danh sách buổi theo môn.
- **Ghi chú tay** — ghi chú cho từng việc và từng buổi dạy; đặt giờ nhắc cho việc.
- **Google Calendar** (huongdt@vlute.edu.vn) — thêm từng việc/buổi dạy, hoặc xuất file `.ics` (lịch giảng, việc, ghi chú, kèm nhắc) để nhập vào lịch.
- **Thông báo** (tab Việc) — nhắc trước giờ giảng (5–90 phút), tóm tắt lịch mỗi sáng, nhắc việc có đặt giờ.
  Bản Android hẹn sẵn trong máy (`@capacitor/local-notifications`, 14 ngày tới) nên nhận được cả khi tắt app;
  bản web chỉ hiện khi app đang mở.
- **Nhập lịch từ file** (tab Môn) — thêm lịch học kỳ mới từ file `.csv` (Excel → *Lưu thành CSV UTF-8*) hoặc `.ics`
  (Google Calendar, Outlook). Có file mẫu CSV; cột nhận diện: Mã HP, Tên học phần, Nhóm, Lớp, Sĩ số, Thứ, Tiết,
  Bắt đầu, Kết thúc, Phòng, Tuần (`1-12`, `1,5,9`, `38-39-40`), Ngày (`16/09, 23/09`), Loại. Có thể ẩn lịch có sẵn.
- **Nợ vay** — tính lịch trả nợ (trả góp đều, dư nợ giảm dần, lãi phẳng; có ân hạn gốc), lưu nhiều khoản vay,
  ghi nhận từng lần trả (một chạm "Đã trả kỳ này" hoặc nhập số khác), theo dõi kỳ tới / quá hạn / dư nợ còn lại,
  mô phỏng trả trước một phần (rút ngắn kỳ hạn hoặc giảm tiền mỗi kỳ, có phí) và ước tính số tiền tất toán.
- **Thư giãn** — nhạc không lời tạo trực tiếp bằng Web Audio (không dùng file nhạc): nền pad + chuông ngũ cung theo
  tần số, nhịp binaural (cần tai nghe), mưa / sóng biển, âm lượng, hẹn giờ tắt, vòng thở 4 giây hít – 6 giây thở.
  Bài **Dịu đau răng** (174 Hz, theta 4 Hz, chuông thưa, sóng biển) kèm mẹo tạm thời khi đau răng và dấu hiệu cần đi
  khám ngay — nhạc chỉ giúp thư giãn, không chữa nguyên nhân. Nhạc phát xuyên tab, nút "Tắt" ở đầu trang.

Dữ liệu lưu cục bộ trên trình duyệt (`zustand/persist`), không cần đăng nhập hay máy chủ.

## Thương hiệu

Huy hiệu **Hương AI** ở góc trên bên phải là chân dung đất sét của Thùy Hương, nhân vật đồng hành của hệ sinh thái
[«Je m'appelle Hương»](https://thuyhuongctu.github.io/Je-mappelle-Huong/) — chỉ mang tính thương hiệu/trang trí,
không phải trợ lý chat. Ảnh đất sét trong `public/brand/`: `huong-chan-dung.webp`, `huong-aodai.webp` và năm tư thế
rồng xanh (`rong-*.webp`, gồm rồng ôm cúp khi xong ngày / trả hết nợ và rồng ôm sen ở tab Thư giãn) dùng ở thẻ chào, trạng thái trống và đầu các tab.

## Phát triển

```bash
npm install
npm run dev      # http://localhost:8080 (sửa trong vite.config.ts nếu cần)
npm run build    # kiểm tra kiểu + build production vào dist/
```

## Triển khai

Đẩy lên nhánh `main` sẽ tự động build và xuất bản qua GitHub Pages (`.github/workflows/deploy-pages.yml`).

> **Lưu ý — app bị chuyển sang BizOn?** GitHub Pages (gói Free) chỉ xuất bản repo **công khai**. Khi repo này để
> *Private*, trang `/Mon-avenir/` bị gỡ và trả lỗi 404; trang 404 chung của `thuyhuongctu.github.io` khi đó chuyển
> mọi đường dẫn lạ sang `/BizOn/`. Cách sửa: *Settings → General → Change visibility → Public*, rồi
> *Settings → Pages → Source: GitHub Actions* và chạy lại workflow *Deploy web app to GitHub Pages*
> (*Actions → Run workflow*). Bản APK Android không bị ảnh hưởng vì chạy file cục bộ.
