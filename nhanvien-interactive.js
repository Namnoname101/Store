// Chờ cho toàn bộ trang HTML được tải xong
document.addEventListener('DOMContentLoaded', () => {

    const scheduleBody = document.querySelector('.table-nhanvien tbody');
    const confirmButton = document.querySelector('.submit-button');
    // Xác định bộ phận dựa trên tiêu đề trang, ví dụ: "Đăng kí ca Phục vụ"
    const pageTitle = document.querySelector('h1').textContent.toLowerCase();
    const boPhan = pageTitle.includes('phục vụ') ? 'phuc-vu' : 'pha-che';

    // Lắng nghe sự kiện click vào ô để chọn/bỏ chọn
    if (scheduleBody) {
        scheduleBody.addEventListener('click', (event) => {
            if (event.target.tagName === 'TD') {
                event.target.classList.toggle('selected');
            }
        });
    }

    // Lắng nghe sự kiện click vào nút "Xác nhận"
    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            const selectedCells = document.querySelectorAll('td.selected');
            if (selectedCells.length === 0) {
                alert("Bạn chưa chọn ca làm nào!");
                return;
            }

            let tenNhanVien = "";
            while (!tenNhanVien) {
                tenNhanVien = prompt("Vui lòng nhập tên của bạn để xác nhận đăng ký:");
                if (tenNhanVien === null) return; // Người dùng bấm Cancel
                if (!tenNhanVien.trim()) {
                    alert("Tên không được để trống!");
                    tenNhanVien = ""; // Reset để vòng lặp tiếp tục
                }
            }
            
            // BƯỚC QUAN TRỌNG: Lấy danh sách đã có và thêm vào
            // Lấy danh sách cũ từ localStorage, nếu không có thì khởi tạo mảng rỗng
            const danhSachDaDangKy = JSON.parse(localStorage.getItem('danhSachDangKy')) || [];

            selectedCells.forEach(cell => {
                const newRegistration = {
                    ten: tenNhanVien.trim(),
                    boPhan: boPhan,
                    ngay: cell.dataset.ngay, // Lấy dữ liệu từ data-ngay
                    ca: cell.dataset.ca,     // Lấy dữ liệu từ data-ca
                    timestamp: new Date().getTime() // Lưu thời gian đăng ký để biết ai sớm nhất
                };
                danhSachDaDangKy.push(newRegistration);
            });

            // Lưu danh sách tổng đã cập nhật vào localStorage
            // Dùng JSON.stringify để chuyển object/array thành một chuỗi
            localStorage.setItem('danhSachDangKy', JSON.stringify(danhSachDaDangKy));

            alert(`Cảm ơn ${tenNhanVien}! Bạn đã đăng ký thành công ${selectedCells.length} ca.`);
            
            // Xóa trạng thái 'selected' khỏi các ô sau khi đã lưu
            selectedCells.forEach(cell => cell.classList.remove('selected'));
        });
    }
});