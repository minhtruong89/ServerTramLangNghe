# TÀI LIỆU API SERVER QUỸ BÔNG SEN - TRẠM LẮNG NGHE (v1.0)

Hệ thống cung cấp API cho ứng dụng ATM giao tiếp với Server Quỹ Bông Sen.

---

## 1. Xác thực & Cấp Token (Login Token)

- **Endpoint**: `POST /api/v1/token`
- **Mục đích**: Cấp Bearer Token cho ATM. Token sử dụng cơ chế **Sliding Window 24h** (tự động reset đếm lùi 24h mỗi khi có request hợp lệ; nếu ngưng gọi quá 24h thì hết hạn và trả mã lỗi `TOKEN_EXPIRED`).

### Request
```json
{
  "user": "microtec",
  "pass": "admin@1234"
}
```

### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "issuedAt": "1777946566071"
}
```

---

## 2. Xác thực Thiết bị ATM & Người bảo chứng (Staff)

- **Endpoint**: `POST /api/v1/validate-atm-staff`
- **Headers**: `Authorization: Bearer <token>`
- **Mục đích**: Kiểm tra tính hợp lệ của cây ATM và nhân viên bảo chứng.
  - Hỗ trợ **Fuzzy Matching 1–2 ký tự**: Quét mã CCCD cho phép lệch 1 ký tự; quét họ tên cho phép lệch 1–2 ký tự do OCR. Nếu khớp CCCD nhưng tên lệch nhẹ vẫn coi là `VALID`.

### Request
```json
{
  "atmSerialNumber": "SN-998877",
  "staffList": [
    {
      "citizenId": "079089017448",
      "fullName": "TRUONG HOANG MINH"
    },
    {
      "citizenId": null,
      "fullName": "LE VAN CHINH"
    }
  ],
  "timestamp": "1777946566071"
}
```

### Response (200 OK)
```json
{
  "atmStatus": "VALID",
  "atmId": "ATM_001",
  "staffResults": [
    {
      "citizenId": "079089017448",
      "fullName": "TRUONG HOANG MINH",
      "status": "VALID",
      "staffId": "STAFF_002"
    },
    {
      "citizenId": null,
      "fullName": "LE VAN CHINH",
      "status": "VALID",
      "staffId": "STAFF_003"
    }
  ],
  "message": "ATM and Operator are valid",
  "serverTime": "1777946566071"
}
```

---

## 3. Tiến trình Hội thoại (Conversation State Machine)

- **Endpoint**: `POST /api/v1/conversation`
- **Headers**: `Authorization: Bearer <token>`

### 3.1 Khởi tạo hội thoại (Action START)
- **Quy tắc**: Người bảo chứng nhập số tiền đề xuất (`proposedAmount`), tối đa `2.000.000 VND` (cấu hình trong `rule_engine.json`). Vượt quá hoặc $\le 0$ sẽ bị từ chối ngay.

```json
{
  "atmId": "ATM_001",
  "staffList": [
    { "staffId": "STAFF_002" },
    { "staffId": "STAFF_003" }
  ],
  "proposedAmount": 1500000,
  "action": "START",
  "timestamp": "1777946566071"
}
```
**Response**: Trả về `conversationId` và câu chào chuẩn đã tích hợp xin chấp thuận (Mục 1 + 2).

### 3.2 Tiếp tục hội thoại (Action PENDING)
- **Kể tự do (Mục 3)**: Khi cô bác đang kể mà chưa nói `"Tôi đã kể xong"`, server trả `status: "PENDING"`, `message: ""` để ATM không ngắt lời.
- **Hỏi đáp tuần tự**: Khi người dân trả lời, server gọi AI đối chiếu 31 mục và hỏi câu còn thiếu tiếp theo.
- **Yêu cầu scan (Mục 31)**: Nếu người dân xác nhận có giấy khám bệnh/đơn thuốc, server chuyển sang `status: "UPLOAD"` kèm câu `message: "Cô bác scan dùm con ảnh hồ sơ bệnh án."`.

### 3.3 Thông báo đã upload chứng từ (Action UPLOAD)
Sau khi ATM tải file lên qua API `/api/v1/upload`, gửi action `UPLOAD`:
```json
{
  "conversationId": "CONV_1777946566071",
  "action": "UPLOAD",
  "message": "Đã úp hình ảnh hồ sơ bệnh án",
  "timestamp": "1777946566073"
}
```

### 3.4 Xác nhận kết thúc (Action CONFIRM)
- Server tóm tắt hoàn cảnh (Mục 35) và chuyển sang `status: "CONFIRM"`.
- ATM phản hồi:
  - `"YES"` / `"ĐÚNG"` $\rightarrow$ Server trả `status: "FINISHED"` kèm lời cảm ơn (Mục 36).
  - `"CANCEL"` $\rightarrow$ Server quay lại `PENDING` để cô bác chỉnh sửa, bổ sung thông tin.

---

## 4. Tải lên Hồ sơ/Giấy tờ scan (Upload API)

- **Endpoint**: `POST /api/v1/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `conversationId`: Mã phiên hội thoại
  - `file`: Tệp ảnh scan hoặc PDF
- **Response**:
```json
{
  "fileName": "CONV_1777946566071_1777946567000.jpg",
  "fileUrl": "http://server-ip:3000/api/v1/files/CONV_1777946566071_1777946567000.jpg",
  "uploadedAt": "1777946567000"
}
```

---

## 5. Gom thông tin & Chấm điểm Giải ngân (Medical Record)

- **Endpoint**: `POST /api/v1/medical-record`
- **Headers**: `Authorization: Bearer <token>`
- **Mục đích**: Gửi toàn bộ dữ liệu lên để server đối chiếu, gọi OpenAI chấm điểm theo công thức chuẩn:
  - $\text{Severity} = \min(100, \text{Emergency} + \text{Income} + \text{Family} + \text{Health})$
  - Tra bảng hệ số: $0\% \rightarrow 100\%$
  - $\text{Tiền nhận} = \text{Số tiền đề xuất} \times \text{Hệ số giải ngân}$
  - Server kiểm tra chéo (Double-check): Nếu điểm/hệ số của AI bị lệch số học hoặc ca không có giấy tờ (Mức B) $\rightarrow$ bật `requireStaffConfirm: true`.

### Request
```json
{
  "atmId": "ATM_001",
  "staffList": [
    { "staffId": "STAFF_002" },
    { "staffId": "STAFF_003" }
  ],
  "conversationId": "CONV_1777946566071",
  "data": [
    { "type": "TEXT", "content": "NGUYỄN THỊ LỤA", "timestamp": "1777946566071" },
    { "type": "TEXT", "content": "57 tuổi", "timestamp": "1777946566072" },
    { "type": "FILE", "fileName": "don_thuoc.jpg", "fileUrl": "http://.../don_thuoc.jpg", "timestamp": "1777946566073" }
  ],
  "submittedAt": "1777946566080"
}
```

### Response Duyệt Thành Công (200 OK)
```json
{
  "record": "REC_1777946567000",
  "status": "APPROVED",
  "proposedAmount": 1500000,
  "severityScore": 71,
  "disbursementRate": 80,
  "approvedAmount": 1200000,
  "currency": "VND",
  "requireStaffConfirm": false,
  "message": "Hồ sơ đã được duyệt",
  "processedAt": "1777946567000"
}
```

### Response Từ Chối (Hệ số 0% / Vi phạm / Thiếu thông tin)
```json
{
  "record": "REC_1777946567001",
  "status": "REJECTED",
  "proposedAmount": 1500000,
  "severityScore": 0,
  "disbursementRate": 0,
  "approvedAmount": 0,
  "currency": "VND",
  "requireStaffConfirm": false,
  "message": "Hồ sơ không đủ điều kiện giải ngân",
  "processedAt": "1777946567000"
}
```
