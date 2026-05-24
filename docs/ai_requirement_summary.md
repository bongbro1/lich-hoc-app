# Yêu cầu hệ thống AI cá nhân hóa (Self-hosted AI)

Tài liệu này tóm tắt các yêu cầu và giải pháp kỹ thuật để xây dựng trợ lý AI cho ứng dụng quản lý lịch học, tập trung vào tính riêng tư, miễn phí vận hành và cá nhân hóa dữ liệu người dùng.

## 1. Mục tiêu (Objectives)
- Xây dựng hệ thống AI có khả năng giải đáp thắc mắc dựa trên dữ liệu cá nhân của từng người dùng (lịch học, điểm số, nhiệm vụ).
- Tự vận hành trên Server riêng (Self-hosted) để làm chủ dữ liệu.
- Không tốn chi phí gọi API bên ngoài (Free inference).

## 2. Yêu cầu kỹ thuật (Technical Requirements)

### 2.1. Server & Phần cứng
- **Hệ điều hành:** Ưu tiên Linux (Ubuntu).
- **Phần cứng:** 
    - RAM: Tối thiểu 16GB.
    - GPU: Ưu tiên có Card đồ họa Nvidia (VRAM >= 8GB) để đạt tốc độ xử lý mượt mà.
    - Lưu trữ: Tối thiểu 20GB trống để lưu model.

### 2.2. "Bộ não" AI (LLM Model)
- **Lựa chọn ưu tiên:** 
    - **Qwen 2.5 (7B/14B):** Tối ưu nhất cho tiếng Việt và xử lý dữ liệu cấu trúc (lịch học).
    - **Llama 3.1 (8B):** Đa năng, cộng đồng hỗ trợ mạnh.
- **Nguồn:** Tải thông qua Ollama hoặc Hugging Face.

### 2.3. Công cụ triển khai (Inference Engine)
- **Ollama:** Công cụ chính để quản lý và chạy Model trên server.
- **Chuẩn kết nối:** Cung cấp API chuẩn OpenAI (REST API) để App dễ dàng kết nối.

## 3. Giải pháp cá nhân hóa (Personalization - RAG)
Để AI hiểu được dữ liệu riêng của từng người dùng mà không cần huấn luyện lại (Training):

1.  **Database Integration:** Server kết nối trực tiếp với Database của hệ thống (Firebase/MySQL).
2.  **Context Injection:** 
    - Khi nhận câu hỏi kèm `studentId`, Server sẽ truy vấn lịch học tương ứng.
    - Chuyển dữ liệu lịch học thành định dạng văn bản (ví dụ: "Thứ 2: Tiết 1-3 môn Toán...").
    - Đưa dữ liệu này vào phần `System Instruction` của AI trước khi xử lý câu hỏi của User.

## 4. Mô hình vận hành (Workflow)
1.  **Mobile App:** Gửi yêu cầu gồm `Câu hỏi` + `Mã sinh viên` lên Server của bạn.
2.  **Server Backend:** 
    - Tiếp nhận yêu cầu.
    - Lấy dữ liệu lịch học từ Database.
    - Tạo Prompt hoàn chỉnh gửi cho Ollama.
3.  **Ollama:** Xử lý bằng Model (Qwen/Llama) và trả về kết quả.
4.  **Server Backend:** Trả kết quả cuối cùng về cho App.

## 5. Ưu điểm của giải pháp
- **Chi phí:** 0đ phí API (chỉ tốn tiền điện/thuê server).
- **Bảo mật:** Dữ liệu lịch học không bị gửi sang bên thứ 3 (OpenAI/Google).
- **Linh hoạt:** Có thể tự chỉnh sửa "tính cách" trợ lý AI theo ý muốn.
