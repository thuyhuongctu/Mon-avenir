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

Dữ liệu lưu cục bộ trên trình duyệt (`zustand/persist`), không cần đăng nhập hay máy chủ.

## Thương hiệu

Huy hiệu **Hương AI** ở góc trên bên phải là chân dung đất sét của Thùy Hương, nhân vật đồng hành của hệ sinh thái
[«Je m'appelle Hương»](https://thuyhuongctu.github.io/Je-mappelle-Huong/) — chỉ mang tính thương hiệu/trang trí,
không phải trợ lý chat. Ảnh đất sét trong `public/brand/`: `huong-chan-dung.webp`, `huong-aodai.webp` và năm tư thế
rồng xanh (`rong-*.webp`) dùng ở thẻ chào, trạng thái trống và đầu các tab.

## Phát triển

```bash
npm install
npm run dev      # http://localhost:8080 (sửa trong vite.config.ts nếu cần)
npm run build    # kiểm tra kiểu + build production vào dist/
```

## Triển khai

Đẩy lên nhánh `main` sẽ tự động build và xuất bản qua GitHub Pages (`.github/workflows/deploy-pages.yml`).
