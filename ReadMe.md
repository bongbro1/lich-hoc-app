# Ứng dụng Quản lý Lịch học (Lich Hoc App)

Lich Hoc App là một ứng dụng di động đa năng được phát triển trên nền tảng React Native (Expo). Ứng dụng không chỉ giúp sinh viên trường ICTU va TNUT quản lý lịch học, điểm số một cách hiệu quả mà còn tích hợp mạng xã hội thu nhỏ, nhắn tin, gọi video trực tuyến và tiện ích thời tiết.

## Công nghệ sử dụng

- **Khung ứng dụng (Framework):** React Native & Expo.
- **Ngôn ngữ:** TypeScript.
- **Quản lý điều hướng:** React Navigation (Native Stack, Bottom Tabs).
- **Giao diện & UI Components:** React Native Paper, Phosphor Icons, Expo Linear Gradient.
- **Dịch vụ Đám mây (Backend):** Firebase (Authentication, Firestore, Cloud Messaging).
- **Giao tiếp thời gian thực:** Socket.io (chat), Agora RTC (gọi video/âm thanh).
- **Bản đồ & Vị trí:** Expo Location, React Native Geolocation Service.
- **Tiện ích khác:** Lịch Âm - Dương (solarlunar), Markdown display.

## Chức năng chi tiết của các màn hình (Screens)

Dưới đây là chi tiết về chức năng của từng màn hình trong ứng dụng, được tổ chức trong thư mục `src/screens`:

### 1. Xác thực và Tài khoản
- **LoginScreen:** Màn hình đăng nhập và đăng ký. Sử dụng Firebase Authentication để bảo mật thông tin người dùng.
- **EditProfileDetailsScreen:** Cho phép người dùng cập nhật thông tin cá nhân, ảnh đại diện và giới thiệu bản thân.
- **SettingsScreen:** Màn hình cài đặt các tùy chọn của ứng dụng (ngôn ngữ, giao diện, quyền thông báo).

### 2. Quản lý Học tập
- **HomeScreen & DashboardScreen:** Bảng điều khiển trung tâm hiển thị tóm tắt lịch học hôm nay, thời tiết hiện tại và các thông báo mới nhất.
- **ScheduleScreen:** Màn hình quản lý lịch học chi tiết dạng lịch (Calendar). Hỗ trợ hiển thị lịch Dương và lịch Âm, giúp sinh viên dễ dàng theo dõi các sự kiện quan trọng.
- **GradesScreen:** Nơi ghi chép, theo dõi và thống kê điểm số các môn học, giúp đánh giá tiến độ học tập.
- **CreateNoteScreen:** Tính năng tạo ghi chú nhanh cho các bài giảng hoặc việc cần làm (To-do list).

### 3. Tương tác & Mạng xã hội
- **ChatScreen & ChatDetailScreen:** Hệ thống nhắn tin trực tiếp và nhóm chat thời gian thực (tích hợp Socket.io và Firestore).
- **Call Screens (Thư mục call_screens):** Cung cấp tính năng gọi điện thoại và gọi video trực tuyến giữa các người dùng với độ trễ thấp nhờ Agora SDK.
- **ProfileFeedScreen & PostDetailScreen:** Bảng tin cá nhân, nơi người dùng có thể chia sẻ các bài viết, trạng thái hoặc xem bài đăng của bạn bè.
- **CreateStoryScreen:** Màn hình tạo "Story" (tin tức 24h) để chia sẻ nhanh các khoảnh khắc học tập.

### 4. Kết nối Bạn bè
- **FriendsScreen:** Danh sách bạn bè, quản lý lời mời kết bạn.
- **FriendsNearbyScreen:** Tính năng tìm kiếm bạn bè hoặc sinh viên cùng trường đang ở gần (dựa trên dịch vụ định vị Geolocation).

### 5. Tiện ích & Thông báo
- **NotificationsScreen & NotificationDetailScreen:** Quản lý tất cả thông báo hệ thống, nhắc nhở lịch học, và thông báo tương tác từ bạn bè.
- **WeatherScreen:** Cung cấp thông tin dự báo thời tiết chi tiết theo thời gian thực dựa trên vị trí hiện tại, giúp người dùng chuẩn bị trước khi đến trường.
- **AboutScreen & HelpCenterScreen:** Thông tin giới thiệu về ứng dụng, phiên bản và trung tâm hỗ trợ giải đáp thắc mắc.

## Hướng dẫn Cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống
- Cài đặt **Node.js** (khuyến nghị bản 18.x trở lên).
- Thiết lập **Expo CLI** trên máy tính.
- Cài đặt **Android Studio** (để dùng máy ảo Android) hoặc **Xcode** (để dùng máy ảo iOS).
- Phải có file cấu hình Firebase (`google-services.json` cho Android và `GoogleService-Info.plist` cho iOS) đặt trong thư mục gốc.

### Các bước cài đặt

1. Clone dự án về máy và di chuyển vào thư mục dự án:
   ```bash
   cd lich-hoc-app
   ```

2. Cài đặt các gói thư viện (dependencies):
   ```bash
   npm install
   ```

3. Khởi động môi trường phát triển (Expo Packager):
   ```bash
   npm start
   ```

4. Chạy trên thiết bị ảo hoặc thật:
   - Chạy trên Android:
     ```bash
     npm run android
     ```
   - Chạy trên iOS:
     ```bash
     npm run ios
     ```

## Cấu trúc Thư mục Chính

- `src/components/`: Các thành phần giao diện dùng chung (UI Components).
- `src/screens/`: Chứa toàn bộ các màn hình hiển thị của ứng dụng như đã liệt kê ở trên.
- `src/navigation/`: Cấu hình bộ điều hướng (Router/Navigation) giữa các màn hình.
- `src/services/`: Quản lý các lệnh gọi API và các dịch vụ bên ngoài (Firebase, Agora, Weather API).
- `src/utils/` & `src/helpers/`: Các hàm tiện ích dùng chung (xử lý ngày tháng, chuyển đổi lịch...).
- `App.tsx`: File cấu hình khởi chạy gốc của toàn bộ ứng dụng.

## Lưu ý Phát triển

Do dự án có sử dụng nhiều thư viện giao tiếp với phần cứng và dịch vụ hệ thống (như Agora, Firebase Native, Geolocation), bạn không thể chạy ứng dụng qua app Expo Go thông thường. Bạn bắt buộc phải chạy lệnh `npx expo run:android` hoặc `npx expo run:ios` để build Custom Dev Client.
