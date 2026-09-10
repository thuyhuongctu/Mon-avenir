# Mon Avenir

Lịch giảng, việc cần làm và môn học của Đỗ Thùy Hương (VLUTE · CTU) — phong cách **claymorphism ("3D đất sét")**, cùng ngôn ngữ thiết kế với [Chansonia](https://github.com/thuyhuongctu/Chansonia).

## Tính năng

- **Hôm nay** — buổi giảng trong ngày, trạng thái tự động (sắp tới / đang dạy / xong), tick tay khi cần.
- **Tuần** — lịch tuần dạng lưới giờ, chuyển tuần trước/sau.
- **Việc** — danh sách việc cần làm theo từng ngày, gợi ý tự động (soạn bài, điểm danh…) dựa trên buổi giảng.
- **Môn** — tổng quan các môn đang dạy, số buổi còn lại, danh sách buổi theo môn.

Dữ liệu lưu cục bộ trên trình duyệt (`zustand/persist`), không cần đăng nhập hay máy chủ.

## Phát triển

```bash
npm install
npm run dev      # http://localhost:8080 (sửa trong vite.config.ts nếu cần)
npm run build    # kiểm tra kiểu + build production vào dist/
```

## Triển khai

Đẩy lên nhánh `main` sẽ tự động build và xuất bản qua GitHub Pages (`.github/workflows/deploy-pages.yml`).
