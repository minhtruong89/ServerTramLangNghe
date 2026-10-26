# HƯỚNG DẪN MUA VPS VÀ TRIỂN KHAI SERVER QUỸ BÔNG SEN (1-CLICK DOCKER)

Tài liệu này dành cho người không chuyên sâu về hạ tầng, hướng dẫn từng bước mua máy chủ giá rẻ và triển khai dự án.

---

## 1. Mua máy chủ (VPS) giá rẻ, chất lượng cao

Dự án lưu thông tin cá nhân và dữ liệu y tế của người dân, nên khuyến nghị thuê VPS đặt tại trung tâm dữ liệu **Việt Nam** (tốc độ cao, không bị ảnh hưởng bởi đứt cáp quang biển, tuân thủ Nghị định 13/2023/NĐ-CP).

### Gợi ý nhà cung cấp uy tín:
1. **Vietnix** (vietnix.vn) - Gói Cloud VPS Pro hoặc SSD VPS
2. **Bizfly Cloud** (bizflycloud.vn) - Dịch vụ của VCCorp
3. **Viettel IDC** (viettelidc.com.vn)

### Cấu hình khuyến nghị:
- **CPU**: 2 vCPU
- **RAM**: 4 GB RAM (đủ chạy NodeJS, Postgres và Docker mượt mà)
- **Ổ cứng (SSD)**: 50 GB - 60 GB SSD
- **Hệ điều hành**: **Ubuntu 22.04 LTS** hoặc **Ubuntu 24.04 LTS (64-bit)**
- **Chi phí dự kiến**: ~250.000đ - 450.000đ / tháng.

Sau khi mua, nhà cung cấp sẽ gửi cho bạn:
- **Địa chỉ IP máy chủ** (Ví dụ: `103.123.45.67`)
- **Tài khoản**: `root`
- **Mật khẩu**: `xxxxxxxxx`

---

## 2. Kết nối vào VPS từ máy tính

Trên máy tính Windows của bạn:
1. Mở **PowerShell** hoặc **Command Prompt**.
2. Gõ lệnh:
   ```bash
   ssh root@103.123.45.67
   ```
   *(Thay `103.123.45.67` bằng IP VPS thực tế của bạn).*
3. Nhập mật khẩu khi được hỏi (khi gõ mật khẩu sẽ không hiện ký tự, cứ gõ đúng rồi Enter).

---

## 3. Cài đặt Docker & Docker Compose trên VPS (Chỉ làm 1 lần)

Khi đã đăng nhập vào màn hình đen của VPS, copy và dán nguyên khối lệnh sau:

```bash
# 1. Cập nhật hệ thống
apt-get update && apt-get upgrade -y

# 2. Cài đặt Docker tự động
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Cài đặt Docker Compose
apt-get install -y docker-compose-plugin git
```

Kiểm tra Docker đã chạy:
```bash
docker --version
docker compose version
```

---

## 4. Đưa mã nguồn lên VPS và Khởi chạy

### Bước 4.1: Tải mã nguồn lên VPS
Bạn có thể dùng Git hoặc phần mềm đồ họa **FileZilla** / **WinSCP**:
- Kết nối bằng giao thức SFTP, nhập IP, `root`, mật khẩu.
- Kéo thả toàn bộ thư mục `Server Tram Lang Nghe` lên thư mục `/opt/server-tram-lang-nghe` trên VPS.

### Bước 4.2: Cấu hình file .env
Trên VPS, vào thư mục dự án:
```bash
cd /opt/server-tram-lang-nghe
nano .env
```
Điền đúng `OPENAI_API_KEY` và mật khẩu cơ sở dữ liệu nếu muốn đổi. Nhấn `Ctrl + O` để lưu, `Ctrl + X` để thoát.

### Bước 4.3: Khởi chạy 1 lệnh duy nhất (Docker Compose)
Chạy lệnh sau:
```bash
docker compose up -d --build
```

Lệnh này sẽ tự động:
1. Tải và cấu hình PostgreSQL 16.
2. Build ứng dụng NestJS.
3. Chạy Server trên cổng `3000`.

Kiểm tra server đang chạy:
```bash
docker compose ps
docker compose logs -f api
```

Khi thấy dòng chữ:
```
Server Quỹ Bông Sen - Trạm Lắng Nghe đang chạy trên port: 3000
```
tức là server đã hoạt động hoàn hảo 24/24!

---

## 5. Cập nhật cấu hình khi có nhân viên mới hoặc đổi cây ATM

Các file cấu hình và prompt được gắn trực tiếp ra ngoài máy chủ (Volume Mount). Khi cần thêm người hoặc đổi prompt:
- Bạn chỉ cần mở file:
  - `/opt/server-tram-lang-nghe/config/operator_list.json`
  - `/opt/server-tram-lang-nghe/config/atm_list.json`
  - `/opt/server-tram-lang-nghe/prompts/llm_conversation_new.txt`
- Chỉnh sửa nội dung và lưu lại.
- Khởi động lại container nhẹ nhàng trong 1 giây:
  ```bash
  docker compose restart api
  ```
