// Chờ cho toàn bộ trang HTML được tải xong
document.addEventListener('DOMContentLoaded', () => {

    // Tìm đến phần thân của bảng
    const scheduleBody = document.querySelector('.table-nhanvien tbody');

    // Nếu tìm thấy bảng thì mới lắng nghe sự kiện
    if (scheduleBody) {
        // "Lắng nghe" các cú click chuột bên trong toàn bộ phần thân của bảng
        scheduleBody.addEventListener('click', (event) => {
            
            // event.target chính là phần tử mà người dùng đã click vào
            // Chúng ta chỉ hành động nếu nó là một ô <td>
            if (event.target.tagName === 'TD') {
                const cell = event.target;
                
                // classList.toggle là một hàm cực kỳ hữu ích:
                // - Nếu 'cell' chưa có class 'selected', nó sẽ THÊM class này vào.
                // - Nếu 'cell' đã có class 'selected', nó sẽ XÓA class này đi.
                cell.classList.toggle('selected');
            }
        });
    }

    // ... (Phần code cho nút "Xác nhận" và các nút khác của bạn sẽ nằm ở đây) ...
    // Ví dụ:
    const confirmButton = document.querySelector('.submit-button');
    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            // Lấy tất cả các ô đã được chọn (có class 'selected')
            const selectedCells = document.querySelectorAll('td.selected');
            if (selectedCells.length === 0) {
                alert("Bạn chưa chọn ca làm nào!");
                return;
            }
            let tenNhanVien = "";
            while (!tenNhanVien) {
                tenNhanVien = prompt("Vui lòng nhập tên của bạn để xác nhận đăng ký:");
                if (!tenNhanVien) {
                    alert("Nhập tên dô mới biết là ai chứ !!!");
                }
            }
            alert(`Cảm ơn ${tenNhanVien}! Bạn đã đăng ký thành công ${selectedCells.length} ca.`);
        });
    }
});